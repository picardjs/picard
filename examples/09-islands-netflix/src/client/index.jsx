import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { resumePicard } from 'picard-js/adapter';

function reactConverter() {
  return {
    convert(lazyComponent, { api, data = {} }) {
      let Component,
        initialData = {};

      return {
        async load() {
          [{ default: Component }] = await Promise.all([
            lazyComponent(),
            ...Object.entries(data).map(async ([name, load]) => {
              const value = await load();
              initialData[name] = value;
            }),
          ]);
        },
        mount(container, props, locals) {
          hydrateRoot(container, <Component {...props} {...initialData} api={api} />);
        },
      };
    },
  };
}

const stores = {};

window.picard = resumePicard({
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
            return stores[name];
          },
          setStore(name, loader) {
            loader().then((store) => {
              stores[name] = store.default({}, api);
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
