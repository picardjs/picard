const esbuild = require('esbuild');
const { sassPlugin } = require('esbuild-sass-plugin');
const { resolve } = require('path');

esbuild.build({
  entryPoints: [resolve(__dirname, 'src/index.jsx')],
  minify: true,
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
