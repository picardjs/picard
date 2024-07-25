import { build } from 'esbuild';
import { generateDeclaration } from 'dets';
import { resolve } from 'node:path';
import { writeFile, readFile, readdir, rm } from 'node:fs/promises';

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

async function createDeclHead(appDir) {
  const readmePath = resolve(appDir, 'README.md');
  const readme = await readFile(readmePath, 'utf8');
  const desc = readme
    .split('\n')
    .filter((line) => !line.startsWith('#') && line.length > 0)
    .map((line) => ` * ${line}`);
  return ['/**', ...desc, ' * @module', ' */'].join('\n');
}

export async function buildOne(app) {
  const root = resolve(process.cwd(), 'src');
  const appDir = resolve(root, `apps/${app}`);
  const typesDir = resolve(root, 'types');
  const { name, platform, minify, entry, formats, outDirs, globalName, extension } = await readJson(
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
        define: {
          'import.meta.env': 'true',
          'import.meta.env.MODE': '"production"',
        },
        outExtension: { '.js': ext },
      });

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
