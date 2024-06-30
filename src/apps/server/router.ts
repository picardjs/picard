import { createRouteMatcher } from '@/common/utils/matcher';
import type { DependencyInjector, RouterService } from '@/types';

const pageQualifier = 'page:';

export function createRouter(injector: DependencyInjector): RouterService {
  const scope = injector.get('scope');

  const findRoutes = () => {
    const state = scope.readState();
    return Object.keys(state.components)
      .filter((m) => m.startsWith(pageQualifier))
      .map((m) => m.substring(pageQualifier.length));
  };

  const matcher = createRouteMatcher(findRoutes);

  return {
    dispose() {},
    findRoutes,
    navigate() {},
    matchRoute(name) {
      if (name.startsWith(pageQualifier)) {
        const route = name.substring(pageQualifier.length);
        const result = matcher(route);

        if (result) {
          const [path, data] = result;
          return {
            name: `${pageQualifier}${path}`,
            data,
          };
        }
      }

      return undefined;
    },
  };
}
