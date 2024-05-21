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

const demos = {
  browser: [
    '01-static-page',
    '02-static-page-feed',
    '03-static-page-slots',
    '04-static-page-initial-state',
    '05-static-page-with-routing',
  ],
};

await Promise.all(
  Object.entries(demos).map(([type, targets]) =>
    Promise.all(
      targets.map((target) => copyFile(resolve(dstdir, type, 'picard.js'), resolve(exsdir, target, 'picard.js'))),
    ),
  ),
);
