import { emptyLifecycle } from '../kinds/lifecycle';
import type { ComponentRef, DependencyInjector } from '../types';

export function createRenderer(injector: DependencyInjector) {
  const scope = injector.get('scope');

  return {
    collect(name: string) {
      return Promise.resolve([]);
    },
    render(component: ComponentRef) {
      // Fallback; render nothing
      return emptyLifecycle;
    },
  };
}
