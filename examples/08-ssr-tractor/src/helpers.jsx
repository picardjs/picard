import React from 'react';
import { renderToString } from 'react-dom/server';

export function reactConverter() {
  return {
    convert(Component) {
      return {
        async stringify(params) {
          return renderToString(<Component {...params} />);
        },
      };
    },
  };
}
