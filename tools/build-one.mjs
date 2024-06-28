import { build } from 'esbuild';
import { generateDeclaration } from 'dets';
import { resolve } from 'node:path';
import { writeFile, readFile } from 'node:fs/promises';

export async function buildOne(app) {
  const root = resolve(process.cwd(), 'src');
  const info = resolve(root, `apps/${app}/app.json`);
  const { name, platform, minify, entry, formats, outDirs } = JSON.parse(await readFile(info, 'utf8'));

  const entryPoints = {
    [name]: resolve(root, `apps/${app}`, entry),
  };
  const logOverride = {
    'package.json': 'verbose',
  };
  const metafile = outDirs.length === 1;
  const declfile = outDirs.length === 1;

  console.log(`Building "${app}" ...`);

  for (const dir of outDirs) {
    const outdir = resolve(process.cwd(), `dist`, dir);

    for (const format of formats) {
      const ext = format === 'cjs' ? '.js' : '.mjs';

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
        outExtension: { '.js': ext },
      });

      if (metafile) {
        await writeFile(resolve(outdir, `meta.${format}.json`), JSON.stringify(result.metafile), 'utf8');
      }
    }

    if (declfile) {
      const declName = resolve(outdir, `${name}.d.ts`);
      const declText = await generateDeclaration({
        name,
        files: [],
        noModuleDeclaration: true,
        types: Object.values(entryPoints),
      });

      await writeFile(declName, declText, 'utf8');
    }
  }

  console.log(`Finished "${app}".`);
}
