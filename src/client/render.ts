import { empty } from './empty';
import type { ComponentRef, ComponentLifecycle, PicardStore, PicardComponent, PicardMicrofrontend } from '../types';

function getLifecycle(component: PicardComponent): ComponentLifecycle {
  return component?.render || empty;
}

function getComponent(state: PicardStore, name: string): ComponentLifecycle {
  const c = state.getState().components[name];

  if (Array.isArray(c)) {
    return getLifecycle(c[0]);
  }

  return empty;
}

function createDynamicComponent(state: PicardStore, mf: PicardMicrofrontend, name: string): ComponentLifecycle {
  const impl = {
    ...empty,
  };
  return {
    async bootstrap(...args) {
      // investigate if we have a MF / NF etc. module that can load dynamically; do that.
      switch (mf.kind) {
        case 'mf':
        case 'nf':
        default:
          // remaining items must have been loaded via a discovery approach and are complete
          break;
      }

      return await impl.bootstrap(...args);
    },
    mount(...args) {
      return impl.mount(...args);
    },
    update(...args) {
      return impl.update(...args);
    },
    unmount(...args) {
      return impl.unmount(...args);
    },
    unload(...args) {
      return impl.unload(...args);
    },
  };
}

function getComponentFrom(state: PicardStore, mf: PicardMicrofrontend, name: string): ComponentLifecycle {
  const cid = mf.components[name];

  if (cid) {
    // component already loaded; let's use it
    return getComponent(state, cid);
  }

  return createDynamicComponent(state, mf, name);
}

function findMicrofrontend(state: PicardStore, source: string) {
  return state.getState().microfrontends.find((m) => m.source === source);
}

export function createRenderer(state: PicardStore) {
  return (component: ComponentRef): ComponentLifecycle => {
    if (typeof component === 'string') {
      // look up if we have this component via its ID.
      return getComponent(state, component);
    } else if (typeof component.source === 'string') {
      // do we have the source? otherwise load it.
      const source = component.source;
      const existing = findMicrofrontend(state, source);

      if (!existing) {
        // create new MF
        const mf: PicardMicrofrontend = {
          kind: 'mf',
          name: source,
          details: {},
          source,
          components: {},
        };
        state.setState((state) => ({
          ...state,
          microfrontends: [...state.microfrontends, mf],
        }));
        return getComponentFrom(state, mf, component.name);
      }

      return getComponentFrom(state, existing, component.name);
    } else if (typeof component.name === 'string') {
      // look up if we have this component via its name / take first.
      return getComponent(state, component.name);
    }

    // Fallback; render nothing
    return empty;
  };
}
