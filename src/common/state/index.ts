import { loadContainer } from './container';
import { createNewQueue } from './queue';
import { initializeStore } from './store';
import {
  registerComponent,
  retrieveComponent,
  createMicrofrontend,
  getExistingLifecycle,
  findMicrofrontend,
  registerAsset,
  retrieveaAsset,
} from './actions';
import { createLazyLifecycle, emptyLifecycle } from '../kinds/lifecycle';
import type { ComponentGetter, DependencyInjector, PicardStore } from '@/types';

/**
 * Creates a new scope for obtaining MF information.
 */
export function createPicardScope(injector: DependencyInjector) {
  const { state: initialState } = injector.get('config');
  const events = injector.get('events');
  const containers: Record<string, Promise<ComponentGetter>> = {};
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
    registerAsset(mf, url, type) {
      return registerAsset(store, mf, url, type);
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
    retrieveAsset(id) {
      return retrieveaAsset(store, id);
    },
    loadAssets(type) {
      return queue.enqueue(() => {
        const assets = scope.readState().assets[type] || [];
        return assets.map((asset) => asset.id);
      });
    },
    loadMicrofrontends(loader) {
      return queue.enqueue(async () => {
        const mfs = await loader;
        await Promise.all(mfs.map((mf) => loadContainer(injector, mf, containers)));
        scope.appendMicrofrontends(mfs);
      });
    },
    loadLifecycle(component) {
      const lc = getExistingLifecycle(scope, component);

      if (!lc) {
        const promise = queue.enqueue(async () => {
          const lc = getExistingLifecycle(scope, component);

          if (!lc) {
            const existing = findMicrofrontend(scope, component);
            const mf = existing || createMicrofrontend(component);
            const name = component.name;
            const container = await loadContainer(injector, mf, containers);
            const lc = await container.load(name);

            if (lc) {
              registerComponent(store, mf, name, lc);
            }

            if (!existing) {
              scope.appendMicrofrontend(mf);
            }

            return lc || emptyLifecycle;
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
          microfrontends.map(async (mf) => {
            const container = await loadContainer(injector, mf, containers);
            const id = mf.components[name];

            if (!id) {
              const lc = await container.load(name);

              if (lc) {
                const c = registerComponent(store, mf, name, lc);
                ids.push(c.id);
              }
            } else {
              ids.push(id);
            }
          }),
        );

        return ids;
      });
    },
    appendMicrofrontend(mf) {
      scope.appendMicrofrontends([mf]);
    },
    appendMicrofrontends(mfs) {
      if (mfs.length > 0) {
        store.setState((state) => ({
          ...state,
          microfrontends: [...state.microfrontends, ...mfs],
        }));

        events.emit('updated-microfrontends', {
          added: mfs.map((m) => m.name),
          removed: [],
        });
      }
    },
    removeMicrofrontend(name) {
      scope.removeMicrofrontends([name]);
    },
    removeMicrofrontends(names) {
      if (names.length > 0) {
        store.setState((state) => ({
          ...state,
          microfrontends: state.microfrontends.filter((m) => !names.includes(m.name)),
        }));

        events.emit('updated-microfrontends', {
          added: [],
          removed: names,
        });
      }
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
