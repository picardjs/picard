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
import { getActiveMfNames, filterItems, mergeItems } from './utils';
import { createLazyLifecycle } from '../formats/lifecycle';
import type {
  ComponentGetter,
  ComponentLifecycle,
  DependencyInjector,
  PicardAsset,
  PicardComponent,
  PicardStore,
} from '@/types';

/**
 * Creates a new scope for obtaining MF information.
 */
export function createPicardScope(injector: DependencyInjector) {
  const { state: initialState } = injector.get('config');
  const events = injector.get('events');
  const containers: Record<string, Promise<ComponentGetter>> = {};
  const store = initializeStore(initialState);
  const queue = createNewQueue();
  const disabledAssets: Array<PicardAsset> = [];
  const disabledComponents: Array<PicardComponent> = [];

  const unsubscribe = store.subscribe((currState, prevState) => {
    if (currState.microfrontends !== prevState.microfrontends) {
      const currMfs = getActiveMfNames(currState);
      const prevMfs = getActiveMfNames(prevState);
      const added = currMfs.filter((m) => !prevMfs.includes(m));
      const removed = prevMfs.filter((m) => !currMfs.includes(m));

      events.emit('updated-microfrontends', {
        added,
        removed,
      });
    }
  });

  const disableMicrofrontends = (names: Array<string>, remove = false) => {
    const flags = remove ? 2 : 1;

    store.setState((state) => ({
      ...state,
      assets: filterItems(state.assets, names, !remove ? disabledAssets : []),
      components: filterItems(state.components, names, !remove ? disabledComponents : []),
      microfrontends: state.microfrontends.map((m) => (names.includes(m.name) ? { ...m, flags } : m)),
    }));
  };

  const enableMicrofrontend = (name: string) => {
    store.setState((state) => ({
      ...state,
      assets: mergeItems(state.assets, disabledAssets, (a) => a.type),
      components: mergeItems(state.components, disabledComponents, (c) => c.name),
      microfrontends: state.microfrontends.map((m) => (m.name === name ? { ...m, flags: 0 } : m)),
    }));
  };

  const convert = (lc: ComponentLifecycle, type: string) => {
    if (lc && type) {
      const framework = injector.get(`framework.${type}`);
      return framework ? framework.convert(lc, {}) : lc;
    }

    return lc;
  };

  const scope: PicardStore = {
    dispose() {
      unsubscribe();
    },
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
      return scope.retrieveComponent(id)?.render;
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
        await Promise.all(mfs.filter((mf) => !mf.flags).map((mf) => loadContainer(injector, mf, containers)));
        scope.appendMicrofrontends(mfs);
      });
    },
    getExport(component) {
      return queue.enqueue(async () => {
        const existing = findMicrofrontend(scope, component.source);
        const mf = existing || createMicrofrontend(component);

        if (!mf.flags) {
          const container = await loadContainer(injector, mf, containers);
          const result = await container.load(component.name);

          if (!existing) {
            scope.appendMicrofrontend(mf);
          }

          return result;
        }

        return undefined;
      });
    },
    loadLifecycle(component) {
      const lc = getExistingLifecycle(scope, component);
      const type = component.framework;

      if (!lc) {
        const name = component.name;
        const promise = queue.enqueue(async () => {
          let lc = getExistingLifecycle(scope, component);

          if (!lc) {
            const existing = findMicrofrontend(scope, component.source);
            const mf = existing || createMicrofrontend(component);

            if (!mf.flags) {
              const container = await loadContainer(injector, mf, containers);
              lc = await container.load(name);

              if (lc && !(name in mf.components)) {
                registerComponent(store, mf, name, lc);
              }

              if (!existing) {
                scope.appendMicrofrontend(mf);
              }
            }
          }

          return convert(lc, type);
        });

        return createLazyLifecycle(() => promise, name);
      }

      return convert(lc, type);
    },
    loadComponents(name) {
      return queue.enqueue(async () => {
        const ids: Array<string> = [];
        const { microfrontends } = store.getState();

        await Promise.all(
          microfrontends
            .filter((mf) => !mf.flags)
            .map(async (mf) => {
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
      }
    },
    toggleMicrofrontend(name) {
      const { microfrontends } = store.getState();
      const current = microfrontends.find((m) => m.name === name);

      if (current?.flags === 0) {
        disableMicrofrontends([name]);
      } else if (current?.flags === 1) {
        enableMicrofrontend(name);
      }
    },
    removeMicrofrontend(name) {
      scope.removeMicrofrontends([name]);
    },
    removeMicrofrontends(names) {
      if (names.length > 0) {
        disableMicrofrontends(names, true);
      }
    },
    updateMicrofrontend(name, details) {
      store.setState((state) => ({
        microfrontends: state.microfrontends.map((item: any) =>
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
