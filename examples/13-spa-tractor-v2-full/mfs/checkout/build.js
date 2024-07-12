const { build } = require('esbuild');

build({
  entryPoints: {
    CartPage: 'src/CartPage.jsx',
    Checkout: 'src/Checkout.jsx',
    Thanks: 'src/Thanks.jsx',
    AddToCart: 'src/AddToCart.jsx',
    MiniCart: 'src/MiniCart.jsx',
    styles: 'src/css/index.css',
  },
  bundle: true,
  splitting: true,
  minify: true,
  format: 'esm',
  platform: 'browser',
  external: ['preact', 'preact/hooks', 'canvas-confetti'],
  outdir: 'dist',
  jsxFactory: 'h',
});
