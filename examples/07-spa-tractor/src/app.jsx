import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { initializePicard, share } from '../../../src/apps/client';
import ProductPage from './product-page';
import { fromReact, withPiletState } from './helpers';
import { createContainer } from './store';
import './style.css';

initializePicard({
  feed: 'https://feed.piral.cloud/api/v1/pilet/tractor-demo',
  services: {
    pilet: () => ({
      extend(api) {
        Object.assign(api, {
          createState(options) {
            const [store, actions] = createContainer(options.state, options.actions, api);
            return (component) => withPiletState(component, store, actions);
          },
          registerExtension(name, Component) {
            api.registerComponent(name, fromReact(Component, api));
          },
        });
      },
    }),
  },
  dependencies: {
    react: share(React),
  },
});

const container = document.querySelector('#app');
const root = createRoot(container);
root.render(<ProductPage />);
