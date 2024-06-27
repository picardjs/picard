import React from 'react';
import { renderToString } from 'react-dom/server';

export function reactConverter() {
  return {
    convert(Component) {
      return {
        async stringify(props) {
          return renderToString(<Component {...props} />);
        },
      };
    },
  };
}
