import type { DependencyInjector, RouterService } from '@/types';

const pageQualifier = 'page:';

export function createRouter(injector: DependencyInjector): RouterService {
  const scope = injector.get('scope');

  return {
    dispose() {},
    findRoutes() {
      const state = scope.readState();
      return Object.keys(state.components)
        .filter((m) => m.startsWith(pageQualifier))
        .map((m) => m.substring(pageQualifier.length));
    },
    navigate() {},
  };
}
