import express from 'express';
import { resolve } from 'path';
import { initializePicard, getIslandsFile } from 'picard-js/node';
import createVanillaConverter from '../public/client/vanilla.js';
import { layout } from './layout';

const port = process.env.PORT || 8096;
const app = express();
const listening = new Promise((resolve) => {
  app.listen(port, () => {
    console.log(`Listening on http://localhost:${port} ...`);
    resolve();
  });
});

const picard = initializePicard({
  // the feed is only loaded on the server; the client resumes from the server's state
  feed: () => listening.then(() => `http://localhost:${port}/feed.json`),
  interactive: true,
  // the lightweight client is served from this process (see below)
  scriptUrl: '/picard/picard.js',
  services: {
    'framework.vanilla': createVanillaConverter,
  },
  client: {
    services: {
      'framework.vanilla': '/client/vanilla.js',
    },
  },
});

app.use(express.static(resolve(__dirname, '../public')));

app.get('/picard/:file', (req, res) => {
  const content = getIslandsFile(req.params.file);

  if (content === undefined) {
    res.sendStatus(404);
  } else {
    res.type('text/javascript').send(content);
  }
});

app.get('/', async (_, res) => {
  const html = await picard.decorate(layout());
  res.send(html);
});
