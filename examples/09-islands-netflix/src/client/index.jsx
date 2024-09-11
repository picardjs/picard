import { resumePicard } from 'picard-js/adapter';

function reactConverter() {
  return {
    convert(lazyComponent, { api, data = {} }) {
      let React,
        ReactDom,
        Component,
        initialData = {};
      return {
        async load() {
          [React, ReactDom, { default: Component }] = await Promise.all([
            import('react'),
            import('react-dom/client'),
            lazyComponent(),
            ...Object.entries(data).map(async ([name, load]) => {
              const value = await load();
              initialData[name] = value;
            }),
          ]);
        },
        mount(container, props, locals) {
          const element = React.createElement(Component, {
            ...props,
            ...initialData,
            api,
          });
          ReactDom.hydrateRoot(container, element);
        },
      };
    },
  };
}

window.picard = resumePicard({
  services: {
    'framework.react': reactConverter,
  },
  dependencies: {
    'react@18.2.0': () => import('react'),
  },
});
