import { build } from 'esbuild';
import { generateDeclaration } from 'dets';
import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';

export async function buildOne(app) {
  const root = resolve(process.cwd(), 'src');
  const entryPoints = {
    picard: resolve(root, `apps/${app}/index.ts`),
  };
  const logOverride = {
    'package.json': 'verbose',
  };
  const outdir = resolve(process.cwd(), `dist/${app}`);
  const declName = resolve(outdir, 'picard.d.ts');
  const platform = app === 'client' || app === 'browser' ? 'browser' : app === 'server' ? 'node' : 'neutral';
  const minify = app === 'browser';

  console.log(`Building "${app}" ...`);

  if (app !== 'browser') {
    // we always build esm, except for the browser
    const esmResult = await build({
      entryPoints,
      bundle: true,
      sourcemap: 'linked',
      outdir,
      minify,
      metafile: true,
      platform,
      logOverride,
      format: 'esm',
      outExtension: { '.js': '.mjs' },
    });

    await writeFile(resolve(outdir, 'meta.esm.json'), JSON.stringify(esmResult.metafile), 'utf8');
  }

  if (app !== 'client') {
    // we always build cjs, except for bundlers (client)
    const cjsResult = await build({
      entryPoints,
      bundle: true,
      sourcemap: 'linked',
      outdir,
      minify,
      metafile: true,
      platform,
      logOverride,
      format: 'cjs',
    });

    await writeFile(resolve(outdir, 'meta.cjs.json'), JSON.stringify(cjsResult.metafile), 'utf8');
  }

  const declText = await generateDeclaration({
    name: 'picard-js',
    files: [],
    noModuleDeclaration: true,
    types: Object.values(entryPoints),
  });

  await writeFile(declName, declText, 'utf8');

  console.log(`Finished "${app}".`);
}
