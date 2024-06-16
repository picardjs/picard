import { emptyLifecycle } from '../kinds/lifecycle';
import { withPilet } from '../kinds/pi';
import { withModuleFederation } from '../kinds/mf';
import { withNativeFederation } from '../kinds/nf';
import type { ComponentGetter, ComponentRef, DependencyInjector, PicardMicrofrontend, PicardStore } from '../types';

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

function findMicrofrontend(state: PicardStore, source: string) {
  return state.readState().microfrontends.find((m) => m.name === source);
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
        const source = component.source;
        const existing = findMicrofrontend(scope, source);

        if (existing) {
          const id = existing.components[component.name];
          return scope.retrieveComponent(id)?.render || emptyLifecycle;
        }
      }

      // Fallback; render nothing
      return emptyLifecycle;
    },
  };
}
