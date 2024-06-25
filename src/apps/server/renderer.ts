import { emptyLifecycle } from '@/common/kinds/lifecycle';
import type { ComponentRef, DependencyInjector, PicardStore } from '@/types';

function findMicrofrontend(state: PicardStore, source: string) {
  return state.readState().microfrontends.find((m) => m.name === source);
}

export function createRenderer(injector: DependencyInjector) {
  const scope = injector.get('scope');

  return {
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
