import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { buildOne } from './build-one.mjs';

const srcdir = resolve(process.cwd(), `src/apps`);

const files = await readdir(srcdir);

await Promise.all(
  files.map(async (file) => {
    if (file.endsWith('.ts')) {
      const app = file.replace('.ts', '');
      await buildOne(app);
    }
  }),
);
