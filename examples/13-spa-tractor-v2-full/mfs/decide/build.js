const { build } = require('esbuild');

build({
  entryPoints: {
    ProductPage: 'src/ProductPage.jsx',
    styles: 'src/css/index.css',
  },
  bundle: true,
  splitting: true,
  minify: true,
  format: 'esm',
  platform: 'browser',
  external: ['preact', 'preact/hooks'],
  outdir: 'dist',
  jsxFactory: 'h',
});
