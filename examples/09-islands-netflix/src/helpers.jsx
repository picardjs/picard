import * as React from 'react';
import { renderToString } from 'react-dom/server';

export function reactConverter() {
  return {
    convert(lazyComponent, api) {
      return {
        async stringify(params) {
          const { default: Component } = await lazyComponent();
          return renderToString(<Component {...params} api={api} />);
        },
      };
    },
  };
}
