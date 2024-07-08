import express from 'express';
import { resolve } from 'path';
import { initializePicard } from 'picard-js/node';
import { layout } from './layout';
import { reactConverter } from './helpers';

const port = process.env.PORT || 8091;
const app = express();
const picard = initializePicard({
  feed: () => Promise.resolve({
    'red': `http://localhost:${port}/mfs/red.json`,
    'blue': `http://localhost:${port}/mfs/blue.json`,
    'green': `http://localhost:${port}/mfs/green.json`,
  }),
  services: {
    'framework.react': reactConverter,
  },
});

app.use(express.static(resolve(__dirname, '../public')));

let count = 0;

app.get('/', (_, res) => {
  res.redirect('/products');
});

app.get('/products/:id?', async (req, res) => {
  const sku = req.params.id;
  const content = layout({ count, sku });
  const html = await picard.decorate(content);
  res.send(html);
});

app.post('/products/:id?', async (req, res) => {
  count++;
  res.redirect(req.path);
});

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port} ...`);
});
