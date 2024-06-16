import express from 'express';
import * as React from 'react';
import { resolve } from 'path';
import { renderToString } from 'react-dom/server';
import { initializePicard } from './picard';
import { render } from './layout';
import ProductPage from './product-page';

const port = 3000;
const app = express();
const picard = initializePicard({
  feed: 'https://feed.piral.cloud/api/v1/pilet/tractor-ssr-demo',
});

app.use(express.static(resolve(__dirname, '../public')));

app.get('/', (_, res) => {
  res.redirect('/products');
});

app.get('/products/:id?', async (req, res) => {
  const sku = req.params.id;
  const plainContent = renderToString(<ProductPage sku={sku} />);
  const content = await picard.decorate(plainContent);
  res.send(render({ content }));
});

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port} ...`);
});
