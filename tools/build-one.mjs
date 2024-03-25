import { build } from 'esbuild';
import { resolve } from 'node:path';

export async function buildOne(app) {
  const entryPoints = [resolve(process.cwd(), `src/apps/${app}.ts`)];
  const outdir = resolve(process.cwd(), `dist/${app}`);
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
  
  console.log(`Finished "${app}".`);
}
