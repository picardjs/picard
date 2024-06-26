import { loadContainer } from './container';
import { createNewQueue } from './queue';
import { initializeStore } from './store';
import { registerComponent, retrieveComponent, createMicrofrontend, getExistingLifecycle } from './actions';
import { createLazyLifecycle, emptyLifecycle } from '../kinds/lifecycle';
import type { DependencyInjector, PicardStore } from '@/types';

/**
 * Creates a new scope for obtaining MF information.
 */
export function createPicardScope(injector: DependencyInjector) {
  const { state: initialState } = injector.get('config');
  const events = injector.get('events');
  const store = initializeStore(initialState);
  const queue = createNewQueue();

  const scope: PicardStore = {
    saveSnapshot() {
      return JSON.stringify(store.getState());
    },
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
    retrieveLifecycle(id) {
      return scope.retrieveComponent(id)?.render || emptyLifecycle;
    },
    loadMicrofrontends(loader) {
      return queue.enqueue(async () => {
        const mfs = await loader;
        scope.appendMicrofrontends(mfs);
      });
    },
    loadLifecycle(component) {
      const lc = getExistingLifecycle(scope, component);

      if (!lc) {
        const promise = queue.enqueue(async () => {
          const lc = getExistingLifecycle(scope, component);

          if (!lc) {
            const mf = createMicrofrontend(component);
            const container = await loadContainer(injector, mf);
            const lifecycle = await container.load(component.name);
            scope.appendMicrofrontend(mf);
            return lifecycle;
          }

          return lc;
        });

        return createLazyLifecycle(() => promise);
      }

      return lc;
    },
    loadComponents(name) {
      return queue.enqueue(async () => {
        const ids: Array<string> = [];
        const { microfrontends } = store.getState();
        await Promise.all(
          microfrontends.map((mf) =>
            loadContainer(injector, mf).then(async (m) => {
              const id = mf.components[name];

              if (!id) {
                const lc = await m.load(name);

                if (lc) {
                  const component = registerComponent(store, mf, name, lc);
                  ids.push(component.id);
                }
              } else {
                ids.push(id);
              }
            }),
          ),
        );
        return ids;
      });
    },
    appendMicrofrontend(mf) {
      scope.appendMicrofrontends([mf]);
    },
    appendMicrofrontends(mfs) {
      store.setState((state) => ({
        ...state,
        microfrontends: [...state.microfrontends, ...mfs],
      }));

      events.emit('updated-microfrontends', {
        added: mfs.map((m) => m.name),
        removed: [],
      });
    },
    removeMicrofrontend(name) {
      scope.removeMicrofrontends([name]);
    },
    removeMicrofrontends(names) {
      store.setState((state) => ({
        ...state,
        microfrontends: state.microfrontends.filter((m) => !names.includes(m.name)),
      }));

      events.emit('updated-microfrontends', {
        added: [],
        removed: names,
      });
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

  return scope;
}
