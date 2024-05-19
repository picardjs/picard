import { readdir, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { buildOne } from './build-one.mjs';

const srcdir = resolve(process.cwd(), `src/apps`);
const dstdir = resolve(process.cwd(), `dist`);
const exsdir = resolve(process.cwd(), `examples`);

const files = await readdir(srcdir);

await Promise.all(
  files.map(async (file) => {
    if (file.endsWith('.ts')) {
      const app = file.replace('.ts', '');
      await buildOne(app);
    }
  }),
);

await Promise.all([
  copyFile(resolve(dstdir, 'browser', 'picard.js'), resolve(exsdir, '01-static-page', 'picard.js')),
  copyFile(resolve(dstdir, 'browser', 'picard.js'), resolve(exsdir, '02-static-page-feed', 'picard.js')),
  copyFile(resolve(dstdir, 'browser', 'picard.js'), resolve(exsdir, '03-static-page-slots', 'picard.js')),
  copyFile(resolve(dstdir, 'browser', 'picard.js'), resolve(exsdir, '04-static-page-initial-state', 'picard.js')),
]);
