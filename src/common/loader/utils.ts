import type { ModuleResolver } from '@/types';

function handleFailure(error: Error, link: string) {
  console.error('Failed to load SystemJS module', link, error);
}

/**
 * Registers a plain module in SystemJS.
 * @param name The name of the module
 * @param resolve The resolver for the module's content.
 */
export function registerModule(name: string, resolve: ModuleResolver) {
  System.register(name, [], (_exports) => ({
    execute() {
      const content = resolve();

      if (content instanceof Promise) {
        return content
          .then((m) => {
            return m.default || m;
          })
          .then(_exports);
      } else {
        _exports(content);
      }
    },
  }));
}

function registerDependencies(dependencies: Array<[string, ModuleResolver]> = []) {
  for (const [name, dependency] of dependencies) {
    if (!System.has(name)) {
      registerModule(name, dependency);
    }
  }
}

/**
 * Registers the given dependency URLs in SystemJS.
 * @param dependencyUrls The dependencies to resolve later.
 */
export function registerDependencyUrls(dependencyUrls: Record<string, string> = {}) {
  const dependencies = Object.entries(dependencyUrls).map(([name, url]): [string, ModuleResolver] => [
    name,
    () => System.import(url),
  ]);
  registerDependencies(dependencies);
}

/**
 * Registers the given dependency resolvers in SystemJS.
 * @param dependencies The dependencies to resolve later.
 */
export function registerDependencyResolvers(dependencies: Record<string, ModuleResolver> = {}) {
  registerDependencies(Object.entries(dependencies));
}

/**
 * Imports a module via SystemJS.
 * @param url The link to the module's root module.
 * @returns The evaluated module or an empty module in case of an error.
 */
export async function loadModule(url: string) {
  try {
    return await System.import(url);
  } catch (error) {
    return handleFailure(error, url);
  }
}
