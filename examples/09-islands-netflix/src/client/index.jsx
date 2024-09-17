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

window.picard = resumePicard({
  services: {
    'framework.react': reactConverter,
    pilet: () => ({
      extend(api) {
        Object.assign(api, {
          Component(props) {
            return <piral-slot name={props.name} data={JSON.stringify(props.params)} />;
          },
          registerComponent() {},
          registerPage() {},
          getStore() {},
          setStore() {},
        });
      },
    }),
  },
  dependencies: {
    'react@18.2.0': () => Promise.resolve(React),
  },
});
