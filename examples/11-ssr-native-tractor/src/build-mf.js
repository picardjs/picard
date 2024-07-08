const { resolve } = require('path');
const { build } = require('esbuild');

const entryName = process.argv.pop();

build({
  entryPoints: [resolve(__dirname, entryName)],
  platform: 'browser',
  format: 'esm',
  bundle: true,
  minify: false,
  outdir: resolve(__dirname, '../public/mfs/dist'),
  external: ['react'],
  loader: {
    '.jpg': 'file',
    '.css': 'file',
  },
});
