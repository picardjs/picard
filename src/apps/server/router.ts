import type { DependencyInjector, RouterService } from '@/types';

const pageQualifier = 'page:';

export function createRouter(injector: DependencyInjector): RouterService {
  return {
    dispose() {},
    findRoutes() {
      return [];
    },
    navigate() {},
  };
}
