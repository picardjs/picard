import { initializeStore } from './store';
import { registerComponent, retrieveComponent } from './actions';
import type { DependencyInjector, PicardStore } from '../types';

/**
 * Creates a new scope for obtaining MF information.
 */
export function createPicardScope(injector: DependencyInjector): PicardStore {
  const { state } = injector.get('config');
  const store = initializeStore(state);

  return {
    readState() {
      return store.getState();
    },
    subscribe(listener) {
      return store.subscribe(listener);
    },
    registerComponent(mf, name, render) {
      return registerComponent(store, mf, name, render);
    },
    retrieveComponent(id) {
      return retrieveComponent(store, id);
    },
    appendMicrofrontend(mf) {
      store.setState((state) => ({
        ...state,
        microfrontends: [...state.microfrontends, mf],
      }));
    },
    removeMicrofrontend(name) {
      store.setState((state) => ({
        ...state,
        microfrontends: state.microfrontends.filter((m) => m.name !== name),
      }));
    },
    updateMicrofrontend(name, details) {
      store.setState((state) => ({
        microfrontends: state.microfrontends.map((item) =>
          item.name === name
            ? {
                ...item,
                ...details,
              }
            : item,
        ),
      }));
    },
  };
}
