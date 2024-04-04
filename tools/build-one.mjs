import { build } from 'esbuild';
import { generateDeclaration } from 'dets';
import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';

export async function buildOne(app) {
  const entryPoints = {
    picard: resolve(process.cwd(), `src/apps/${app}.ts`),
  };
  const outdir = resolve(process.cwd(), `dist/${app}`);
  const declName = resolve(outdir, 'picard.d.ts');
  const platform = app === 'client' ? 'browser' : app === 'server' ? 'node' : 'neutral';

  console.log(`Building "${app}" ...`);

  await build({
    entryPoints,
    bundle: true,
    outdir,
    platform,
    format: 'esm',
    outExtension: { '.js': '.mjs' },
  });

  await build({
    entryPoints,
    bundle: true,
    outdir,
    platform,
    format: 'cjs',
  });

  const declText = await generateDeclaration({
    name: 'picard-js',
    files: [],
    noModuleDeclaration: true,
    types: Object.values(entryPoints),
  });

  await writeFile(declName, declText, 'utf8');

  console.log(`Finished "${app}".`);
}
