import express from 'express';
import cookieSession from 'cookie-session';
import bodyParser from 'body-parser';
import { AsyncLocalStorage } from 'async_hooks';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { resolve } from 'path';
import { initializePicard } from 'picard-js/node';
import { reactConverter, getParams } from './helpers';
import PageLayout from './PageLayout';

const port = 8089;
const app = express();
const context = new AsyncLocalStorage();
const stores = {};
const picard = initializePicard({
  feed: 'https://feed.dev.piral.cloud/api/v1/pilet/netflix-islands-demo',
  interactive: true,
  componentName: 'piral-component',
  slotName: 'piral-slot',
  partName: 'piral-part',
  services: {
    'framework.react': reactConverter,
    pilet: () => ({
      extend(api) {
        const rc = api.registerComponent;
        Object.assign(api, {
          Component(props) {
            return <piral-slot name={props.name} data={JSON.stringify(props.params)} />;
          },
          registerComponent(name, Component, meta) {
            rc(name, Component, {
              ...meta,
              type: 'react',
            });
          },
          registerPage(path, Component, meta) {
            api.registerComponent(`page:${path}`, Component, meta);
          },
          getStore(name) {
            return {
              get() {
                const store = stores[name];
                const data = context.getStore();
                return store(api, data).get();
              },
            };
          },
          setStore(name, loader) {
            loader().then((store) => {
              stores[name] = store.default;
            });
          },
        });
      },
    }),
  },
  dependencies: {
    'react@18.2.0': () => Promise.resolve(React),
  },
});

app.set('trust proxy', 1);

app.use(express.static(resolve(__dirname, '../public')));

app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  cookieSession({
    name: 'sid',
    keys: ['unsafe-example-key'],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  }),
);

app.post('/', (req, res) => {
  const { store, item } = req.body;
  const handler = stores[store];
  req.session.store = {
    ...req.session.store,
    [store]: item ? JSON.parse(item) : null,
  };

  const data = context.getStore();
  return store(api, data).update(item);
  return res.redirect('/browse');
});

app.get('/', (_, res) => {
  return res.redirect('/browse');
});

app.get('/fragment/:id', async (req, res) => {
  const { id } = req.params;
  const name = Buffer.from(id, 'base64').toString('utf8');
  const params = getParams(req.query);
  const fragment = await context.run(req.session.store, () => picard.render(name, params));
  res.send(fragment);
});

app.get('*', async (req, res) => {
  const route = req.path;
  const html = await context.run(req.session.store, () => {
    const content = renderToString(<PageLayout route={route} />);
    return picard.decorate(content);
  });
  res.send(html);
});

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port} ...`);
});
