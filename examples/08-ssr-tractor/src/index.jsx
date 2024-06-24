import express from 'express';
import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { resolve } from 'path';
import { initializePicard } from 'picard-js/server';
import { render } from './layout';
import { reactConverter } from './helpers';
import ProductPage from './product-page';

const port = 8088;
const app = express();
const picard = initializePicard({
  feed: 'https://feed.piral.cloud/api/v1/pilet/tractor-ssr-demo',
  services: {
    'framework.react': reactConverter,
  },
});

app.use(express.static(resolve(__dirname, '../public')));

let count = 0;
let cache = {};

app.get('/', (_, res) => {
  res.redirect('/products');
});

app.get('/products/:id?', async (req, res) => {
  const sku = req.params.id;

  if (!(sku in cache)) {
    const plainContent = renderToString(<ProductPage sku={sku} count={count} />);
    const content = await picard.decorate(plainContent);
    cache[sku] = render({ content });
  }

  res.send(cache[sku]);
});

app.post('/products/:id?', async (req, res) => {
  count++;
  cache = {};
  res.redirect(req.path);
});

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port} ...`);
});
