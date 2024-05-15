import { empty } from './empty';
import { withPilet } from '../kinds/pi';
import { withModuleFederation } from '../kinds/mf';
import { withNativeFederation } from '../kinds/nf';
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
      switch (mf.kind) {
        case 'mf': {
          const container = await withModuleFederation(mf.details.url, mf.details.id);
          const factory = await container.get(name);
          const component = factory();
          Object.assign(impl, component.default || component);
          break;
        }
        case 'nf': {
          const container = await withNativeFederation(mf.details.url);
          const component = await container.get(name);
          Object.assign(impl, component.default || component);
          break;
        }
        default: {
          const container = await withPilet(mf.source);
          const component = container.get(name);
          Object.assign(impl, component);
          break;
        }
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

function createMicrofrontend(source: string): PicardMicrofrontend {
  if (source.startsWith('mf:')) {
    const name = source.substring(3);
    const id = name.substring(0, name.indexOf('@'));
    const url = name.substring(id.length + 1);
    return {
      kind: 'mf',
      name,
      details: {
        id,
        url,
      },
      source,
      components: {},
    };
  } else if (source.startsWith('nf:')) {
    const url = source.substring(3);
    return {
      kind: 'nf',
      name: source,
      details: {
        url,
      },
      source,
      components: {},
    };
  } else {
    return {
      kind: 'pilet',
      name: source,
      details: {} as any,
      source,
      components: {},
    };
  }
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
        const mf = createMicrofrontend(source);
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
