import { withPilet } from '@/common/kinds/pi';
import { withModuleFederation } from '@/common/kinds/mf';
import { withNativeFederation } from '@/common/kinds/nf';
import { createLazyLifecycle, emptyLifecycle } from '@/common/kinds/lifecycle';
import type {
  ComponentRef,
  ComponentLifecycle,
  PicardStore,
  PicardMicrofrontend,
  DependencyInjector,
  ComponentGetter,
} from '@/types';

const containers: Record<string, Promise<ComponentGetter>> = {};

async function createContainer(injector: DependencyInjector, mf: PicardMicrofrontend) {
  switch (mf.kind) {
    case 'mf': {
      return await withModuleFederation(injector, mf.details);
    }
    case 'nf': {
      return await withNativeFederation(injector, mf.details);
    }
    default: {
      return await withPilet(injector, mf.details);
    }
  }
}

async function loadContainer(injector: DependencyInjector, mf: PicardMicrofrontend) {
  let container = containers[mf.name];

  if (!container) {
    container = createContainer(injector, mf);
    containers[mf.name] = container;
  }

  return await container;
}

function getComponentFrom(
  injector: DependencyInjector,
  scope: PicardStore,
  mf: PicardMicrofrontend,
  name: string,
): ComponentLifecycle {
  const cid = mf.components[name];

  if (cid) {
    // component already loaded; let's use it
    return scope.retrieveComponent(cid)?.render || emptyLifecycle;
  }

  // component unknown; let's create it
  return createLazyLifecycle(async () => {
    const container = await loadContainer(injector, mf);
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
        const ids: Array<string> = [];
        const { microfrontends } = scope.readState();
        await Promise.all(
          microfrontends.map((mf) =>
            loadContainer(injector, mf).then(async (m) => {
              const id = mf.components[name];

              if (!id) {
                const lc = await m.load(name);

                if (lc) {
                  const component = scope.registerComponent(mf, name, lc);
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
          return getComponentFrom(injector, scope, existing, component.name);
        } else if (full) {
          const mf = createMicrofrontend(source);
          scope.appendMicrofrontend(mf);
          return getComponentFrom(injector, scope, mf, component.name);
        }
      }

      // Fallback; render nothing
      return emptyLifecycle;
    },
  };
}
