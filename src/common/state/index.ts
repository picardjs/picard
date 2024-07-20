import { loadContainer } from './container';
import { createNewQueue } from './queue';
import { initializeStore } from './store';
import { getActiveMfNames, filterItems, mergeItems } from './utils';
import {
  registerComponent,
  retrieveComponent,
  createMicrofrontend,
  findMicrofrontend,
  registerAsset,
  retrieveaAsset,
  findComponent,
} from './actions';
import type { ComponentGetter, DependencyInjector, PicardAsset, PicardComponent, PicardStore } from '@/types';

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
    registerAsset(mf, asset) {
      return registerAsset(store, mf, asset);
    },
    registerComponent(mf, component) {
      return registerComponent(store, mf, component);
    },
    retrieveComponent(id) {
      return retrieveComponent(store, id);
    },
    retrieveAsset(id) {
      return retrieveaAsset(store, id);
    },
    loadAssets(type) {
      return queue.depends(() => {
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
    getComponent(ref) {
      return queue.depends(async () => {
        const { cid, name, source } = ref;

        if (cid) {
          const component = scope.retrieveComponent(cid);
          const mf = findMicrofrontend(scope, component.origin);

          if (mf && !mf.flags) {
            const container = await loadContainer(injector, mf, containers);
            const result = await container.load(component.name);

            return {
              ...component,
              exports: result,
            };
          }
        } else if (name && source) {
          const existing = findMicrofrontend(scope, source);
          const mf = existing || createMicrofrontend(ref);

          if (mf && !mf.flags) {
            const container = await loadContainer(injector, mf, containers);
            const result = await container.load(name);
            const origin = mf.name;

            if (result && !findComponent(store, name, origin)) {
              registerComponent(store, mf, { name });
            }

            if (!existing) {
              scope.appendMicrofrontend(mf);
            }

            return {
              ...findComponent(store, name, origin),
              exports: result,
            };
          }
        }

        return undefined;
      });
    },
    loadComponents(name, options) {
      return queue.depends(async () => {
        const ids: Array<string> = [];
        const { microfrontends } = store.getState();
        const orderBy = options?.orderBy || 'none';
        const mfs = microfrontends.filter((mf) => !mf.flags);

        if (orderBy === 'origin') {
          mfs.sort((a, b) => a.name.localeCompare(b.name));
        }

        await Promise.all(
          mfs.map(async (mf) => {
            const container = await loadContainer(injector, mf, containers);
            const { components } = store.getState();
            let component = components[name]?.find((m) => m.origin === mf.name);

            if (!component) {
              if (await container.load(name)) {
                component = registerComponent(store, mf, { name });
              } else {
                return;
              }
            }

            ids.push(component.id);
          }),
        );

        if (orderBy === 'cid') {
          ids.sort();
        }

        if (options?.reverse) {
          ids.reverse();
        }

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
    toggleMicrofrontend(origin) {
      const { microfrontends } = store.getState();
      const current = microfrontends.find((m) => m.name === origin);

      if (current?.flags === 0) {
        disableMicrofrontends([origin]);
      } else if (current?.flags === 1) {
        enableMicrofrontend(origin);
      }
    },
    removeMicrofrontend(origin) {
      scope.removeMicrofrontends([origin]);
    },
    removeMicrofrontends(origins) {
      if (origins.length > 0) {
        disableMicrofrontends(origins, true);
      }
    },
    updateMicrofrontend(origin, details) {
      store.setState((state) => ({
        microfrontends: state.microfrontends.map((item: any) =>
          item.name === origin
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
