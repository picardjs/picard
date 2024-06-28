import type { ComponentRef, DependencyInjector } from '@/types';

export function createRenderer(injector: DependencyInjector) {
  const scope = injector.get('scope');

  return {
    render(component: ComponentRef) {
      if (typeof component.cid === 'string') {
        // look up if we have this component via its ID.
        return scope.retrieveLifecycle(component.cid);
      } else if (typeof component.source === 'string') {
        return scope.loadLifecycle(component);
      }

      // Fallback; render nothing
      return undefined;
    },
  };
}
