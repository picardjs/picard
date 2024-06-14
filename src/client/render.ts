import { withPilet } from '../kinds/pi';
import { withModuleFederation } from '../kinds/mf';
import { withNativeFederation } from '../kinds/nf';
import { createLazyLifecycle, emptyLifecycle } from '../kinds/lifecycle';
import type {
  ComponentRef,
  ComponentLifecycle,
  PicardStore,
  PicardComponent,
  PicardMicrofrontend,
  DependencyInjector,
} from '../types';

function getLifecycle(component: PicardComponent): ComponentLifecycle {
  return component?.render || emptyLifecycle;
}

function getComponents(scope: PicardStore, name: string): Array<PicardComponent> {
  return scope.readState().components[name] || [];
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

function getComponentFrom(scope: PicardStore, mf: PicardMicrofrontend, name: string): ComponentLifecycle {
  const cid = mf.components[name];

  if (cid) {
    // component already loaded; let's use it
    return scope.retrieveComponent(cid)?.render || emptyLifecycle;
  }

  // component unknown; let's create it
  return createLazyLifecycle(async () => {
    const container = await loadMicrofrontend(scope, mf);
    return await container.load(name);
  });
}

function findMicrofrontend(state: PicardStore, full: boolean, source: string) {
  const selector = full ? 'source' : 'name';
  return state.readState().microfrontends.find((m) => m[selector] === source);
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

export function createRenderer(injector: DependencyInjector) {
  const scope = injector.get('scope');
  const queue = injector.get('feed');

  return {
    collect(name: string) {
      return queue.enqueue(async () => {
        const { microfrontends } = scope.readState();
        await Promise.all(microfrontends.map((mf) => loadMicrofrontend(scope, mf).then((m) => m.load(name))));
        const components = getComponents(scope, name);
        return components.map((m) => m.id);
      });
    },
    render(component: ComponentRef) {
      if (typeof component === 'string') {
        // look up if we have this component via its ID.
        return scope.retrieveComponent(component)?.render || emptyLifecycle;
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
          scope.appendMicrofrontend(mf);
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
