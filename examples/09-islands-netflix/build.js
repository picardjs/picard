const esbuild = require('esbuild');
const { sassPlugin } = require('esbuild-sass-plugin');
const { resolve } = require('path');

esbuild.build({
  entryPoints: [resolve(__dirname, 'src/server/index.jsx')],
  minify: false,
  bundle: true,
  platform: 'node',
  alias: {
    'picard-js/node': resolve(__dirname, '../../dist/node/picard.js'),
  },
  outfile: resolve(__dirname, 'dist/server.js'),
  plugins: [
    sassPlugin({
      type: 'css-text',
    }),
  ],
});

esbuild.build({
  entryPoints: [resolve(__dirname, 'src/client/index.jsx')],
  minify: true,
  bundle: true,
  platform: 'browser',
  alias: {
    'picard-js/adapter': resolve(__dirname, '../../dist/adapter/picard.mjs'),
  },
  outfile: resolve(__dirname, 'public/dist/picard.js'),
});
