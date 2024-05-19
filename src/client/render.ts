import { emptyLifecycle } from './empty';
import { retrieveComponent } from '../state';
import { withPilet } from '../kinds/pi';
import { withModuleFederation } from '../kinds/mf';
import { withNativeFederation } from '../kinds/nf';
import type { ComponentRef, ComponentLifecycle, PicardStore, PicardComponent, PicardMicrofrontend, LoadingQueue } from '../types';

function getLifecycle(component: PicardComponent): ComponentLifecycle {
  return component?.render || emptyLifecycle;
}

function getComponents(scope: PicardStore, name: string): Array<PicardComponent> {
  return scope.getState().components[name] || [];
}

function getComponentLifecycle(scope: PicardStore, name: string): ComponentLifecycle {
  const [component] = getComponents(scope, name);
  return getLifecycle(component);
}

async function loadMicrofrontend(scope: PicardStore, mf: PicardMicrofrontend) {
  switch (mf.kind) {
    case 'mf': {
      const container = await withModuleFederation(mf, scope);
      return container;
    }
    case 'nf': {
      const container = await withNativeFederation(mf, scope);
      return container;
    }
    default: {
      const container = await withPilet(mf, scope);
      return container;
    }
  }
}

function createDynamicComponent(scope: PicardStore, mf: PicardMicrofrontend, name: string): ComponentLifecycle {
  const impl = {
    ...emptyLifecycle,
  };
  return {
    async bootstrap(...args) {
      const container = await loadMicrofrontend(scope, mf);
      const component = await container.load(name);
      Object.assign(impl, component);
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

function getComponentFrom(scope: PicardStore, mf: PicardMicrofrontend, name: string): ComponentLifecycle {
  const cid = mf.components[name];

  if (cid) {
    // component already loaded; let's use it
    return retrieveComponent(scope, cid)?.render || emptyLifecycle;
  }

  // component unknown; let's create it
  return createDynamicComponent(scope, mf, name);
}

function findMicrofrontend(state: PicardStore, full: boolean, source: string) {
  const selector = full ? 'source' : 'name';
  return state.getState().microfrontends.find((m) => m[selector] === source);
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
      details: {
        url: source,
      },
      source,
      components: {},
    };
  }
}

export function createRenderer(queue: LoadingQueue, scope: PicardStore) {
  return {
    collect(name: string) {
      return queue.enqueue(async () => {
        const { microfrontends } = scope.getState();
        await Promise.all(microfrontends.map((mf) => loadMicrofrontend(scope, mf).then((m) => m.load(name))));
        const components = getComponents(scope, name);
        return components.map((m) => m.id);
      });
    },
    render(component: ComponentRef) {
      if (typeof component === 'string') {
        // look up if we have this component via its ID.
        return retrieveComponent(scope, component)?.render || emptyLifecycle;
      } else if (typeof component.source === 'string') {
        // do we have the source? otherwise load it.
        const source = component.source;
        const full =
          source.startsWith('mf:') ||
          source.startsWith('nf:') ||
          source.startsWith('http:') ||
          source.startsWith('https:');
        const existing = findMicrofrontend(scope, full, source);

        if (existing) {
          return getComponentFrom(scope, existing, component.name);
        } else if (full) {
          const mf = createMicrofrontend(source);
          scope.setState((state) => ({
            ...state,
            microfrontends: [...state.microfrontends, mf],
          }));
          return getComponentFrom(scope, mf, component.name);
        }
      } else if (typeof component.name === 'string') {
        // look up if we have this component via its name / take first.
        return getComponentLifecycle(scope, component.name);
      }

      // Fallback; render nothing
      return emptyLifecycle;
    },
  };
}
