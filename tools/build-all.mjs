import { readdir, cp } from 'node:fs/promises';
import { resolve } from 'node:path';
import { buildOne } from './build-one.mjs';

const srcdir = resolve(process.cwd(), `src/apps`);
const dstdir = resolve(process.cwd(), `dist`);
const exsdir = resolve(process.cwd(), `examples`);

const apps = await readdir(srcdir);

await Promise.all(apps.map(buildOne));

const demos = {
  browser: [
    '01-static-page',
    '02-static-page-feed',
    '03-static-page-slots',
    '04-static-page-initial-state',
    '05-static-page-with-routing',
    '06-static-page-single-spa',
    '10-dependencies-sharing',
    '12-spa-native-tractor',
    '13-spa-tractor-v2-full',
    '14-slot-capabilities',
  ],
  node: ['09-islands-netflix/public'],
};

await Promise.all(
  Object.entries(demos).map(([type, targets]) =>
    Promise.all(
      targets.map((target) => cp(resolve(dstdir, type), resolve(exsdir, target, 'dist'), { recursive: true })),
    ),
  ),
);
