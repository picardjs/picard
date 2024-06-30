import { match } from 'path-to-regexp';

function makeMatchers(routes: Array<string>) {
  return routes.map((route) => match(route));
}

export function createRouteMatcher(getRoutes: () => Array<string>) {
  const allRoutes = [];
  const matchers = makeMatchers(allRoutes);

  return (path: string): [route: string, params: Record<string, string | Array<string>>] | undefined => {
    if (allRoutes.length === 0) {
      const newRoutes = getRoutes();
      allRoutes.push(...newRoutes);
      matchers.push(...makeMatchers(newRoutes));
    }

    for (let i = 0; i < matchers.length; i++) {
      const matcher = matchers[i];
      const result = matcher(path);

      if (result) {
        return [allRoutes[i], result.params];
      }
    }

    return undefined;
  };
}
