import { build } from 'esbuild';
import { generateDeclaration } from 'dets';
import { basename, resolve } from 'node:path';
import { writeFile, readFile, readdir, rm } from 'node:fs/promises';

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

const root = resolve(process.cwd(), 'src');
const { version } = await readJson(resolve(process.cwd(), 'package.json'));
const define = {
  'import.meta.env': 'true',
  'import.meta.env.MODE': '"production"',
  'process.env.PICARD_VERSION': JSON.stringify(version),
};
const embeddedApps = {};

// builds the given app in memory, returning its output files by name
function buildEmbedded(app) {
  if (!embeddedApps[app]) {
    embeddedApps[app] = (async () => {
      const appDir = resolve(root, `apps/${app}`);
      const { name, platform, minify, entry, extension = '.js' } = await readJson(resolve(appDir, `app.json`));
      const result = await build({
        entryPoints: {
          [name]: resolve(appDir, entry),
        },
        bundle: true,
        outdir: resolve(process.cwd(), 'dist', app),
        write: false,
        minify,
        platform,
        format: 'esm',
        splitting: true,
        define,
        outExtension: { '.js': extension },
      });
      return Object.fromEntries(result.outputFiles.map((file) => [basename(file.path), file.text]));
    })();
  }

  return embeddedApps[app];
}

// resolves "embedded:<app>" to the output files of the given app
const embedPlugin = {
  name: 'embed',
  setup(build) {
    build.onResolve({ filter: /^embedded:/ }, (args) => ({
      path: args.path.substring('embedded:'.length),
      namespace: 'embedded',
    }));
    build.onLoad({ filter: /.*/, namespace: 'embedded' }, async (args) => ({
      contents: `export default ${JSON.stringify(await buildEmbedded(args.path))};`,
      loader: 'js',
    }));
  },
};

async function createDeclHead(appDir) {
  const readmePath = resolve(appDir, 'README.md');
  const readme = await readFile(readmePath, 'utf8');
  const desc = readme
    .split('\n')
    .filter((line) => !line.startsWith('#') && line.length > 0)
    .map((line) => ` * ${line}`);
  return ['/**', ...desc, ' * @module', ' */'].join('\n');
}

// same length as "import" to keep the columns of the source map valid
const chunkImport = '$piImp';
const chunkImportPattern = /(?<![\w$.])import\((["'])(\.\/[^"']+)\1\)/g;

// makes the ESM entry usable as a classic script: a classic script that is
// cross-origin (e.g., from a CDN without "crossorigin" or from file://) has
// "about:blank" as base URL for import(), so the chunks are resolved against
// the script's own URL; the IIFE keeps the top-level names out of the global scope
async function convertToClassicScript(file) {
  const code = await readFile(file, 'utf8');

  if (/^\s*(import|export)\b/m.test(code)) {
    throw new Error(`The entry "${file}" contains static imports or exports and cannot be a classic script.`);
  }

  const marker = '\n//# sourceMappingURL=';
  const index = code.lastIndexOf(marker);
  const body = index === -1 ? code : code.substring(0, index);
  const tail = index === -1 ? '' : code.substring(index);
  const prefix = `(()=>{var ${chunkImport}=((b)=>(p)=>import(new URL(p,b).href))(document.currentScript?.src||location.href);`;
  const content = body.replace(chunkImportPattern, `${chunkImport}($1$2$1)`);
  await writeFile(file, `${prefix}\n${content}\n})();${tail}`, 'utf8');

  const mapFile = `${file}.map`;
  const map = await readJson(mapFile).catch(() => undefined);

  if (map) {
    // shift all mappings by the prefix line
    map.mappings = `;${map.mappings}`;
    await writeFile(mapFile, JSON.stringify(map), 'utf8');
  }
}

export async function buildOne(app) {
  const appDir = resolve(root, `apps/${app}`);
  const typesDir = resolve(root, 'types');
  const { name, platform, minify, entry, formats, outDirs, globalName, extension, classic } = await readJson(
    resolve(appDir, `app.json`),
  );

  const entryPoints = {
    [name]: resolve(appDir, entry),
  };
  const logOverride = {
    'package.json': 'verbose',
  };
  const metafile = outDirs.length === 1;
  const declfile = outDirs.length === 1;

  console.log(`Building "${app}" ...`);

  for (const dir of outDirs) {
    const outdir = resolve(process.cwd(), `dist`, dir);

    await rm(outdir, {
      force: true,
      recursive: true,
    });

    for (const format of formats) {
      const ext = extension || (format !== 'esm' ? '.js' : '.mjs');
      const splitting = format === 'esm';

      const result = await build({
        entryPoints,
        bundle: true,
        sourcemap: 'linked',
        outdir,
        minify,
        metafile,
        platform,
        logOverride,
        format,
        globalName,
        splitting,
        define,
        plugins: [embedPlugin],
        outExtension: { '.js': ext },
      });

      if (classic) {
        await convertToClassicScript(resolve(outdir, `${name}${ext}`));
      }

      if (metafile) {
        await writeFile(resolve(outdir, `meta.${format}.json`), JSON.stringify(result.metafile), 'utf8');
      }
    }

    if (declfile) {
      const declFiles = await readdir(typesDir);
      const files = declFiles.map((file) => resolve(typesDir, file));
      const declName = resolve(outdir, `${name}.d.ts`);
      const declHead = await createDeclHead(appDir);
      const declText = await generateDeclaration({
        name,
        files,
        types: [...files, ...Object.values(entryPoints)],
        root: appDir,
        noModuleDeclaration: true,
      });
      await writeFile(declName, `${declHead}\n\n${declText}`, 'utf8');
    }
  }

  console.log(`Finished "${app}".`);
}
