import * as React from 'react';
import { renderToString } from 'react-dom/server';

export function reactConverter() {
  return {
    convert(lazyComponent, { api, data = {} }) {
      return {
        async stringify(props) {
          const { default: Component } = await lazyComponent();
          const initialData = {};

          await Promise.all(
            Object.entries(data).map(async ([name, load]) => {
              const value = await load();
              initialData[name] = value;
            }),
          );

          return renderToString(<Component {...props} {...initialData} api={api} />);
        },
      };
    },
  };
}
