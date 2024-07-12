const { build } = require('esbuild');

build({
  entryPoints: {
    CategoryPage: 'src/CategoryPage.jsx',
    HomePage: 'src/HomePage.jsx',
    StoresPage: 'src/StoresPage.jsx',
    Recommendations: 'src/Recommendations.jsx',
    StorePicker: 'src/StorePicker.jsx',
    Header: 'src/Header.jsx',
    Footer: 'src/Footer.jsx',
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
