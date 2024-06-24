import express from 'express';
import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { resolve } from 'path';
import { initializePicard } from 'picard-js/server';
import { reactConverter } from './helpers';
import PageLayout from './PageLayout';

const port = 8089;
const app = express();
const picard = initializePicard({
  feed: 'https://feed.dev.piral.cloud/api/v1/pilet/netflix-islands-demo',
  componentName: 'piral-component',
  slotName: 'piral-slot',
  partName: 'piral-part',
  services: {
    'framework.react': reactConverter,
  },
});

app.use(express.static(resolve(__dirname, '../public')));

app.get('/fragment/:id', async (req, res) => {
  const { id } = req.params;
  const name = Buffer.from(id, 'base64').toString('utf8');
  const fragment = await picard.renderFragment(name);
  res.send(fragment);
});

app.get('*', async (req, res) => {
  const content = renderToString(<PageLayout route={req.path} />);
  const html = await picard.decorate(content);
  res.send(html);
});

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port} ...`);
});
