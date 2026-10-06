import type { ModuleResolver } from '@/types';

import type { PicardSystem, ModuleExport } from './system';

function handleFailure(error: Error, link: string) {
  console.error('Failed to load Picard module', link, error);
}

/**
 * Registers a plain module in Picard's module registry.
 * @param name The name of the module
 * @param resolve The resolver for the module's content.
 */
export function registerModule(system: PicardSystem, name: string, resolve: ModuleResolver) {
  system.register(name, [], (_exports) => ({
    execute() {
      const content = resolve();

      if (content instanceof Promise) {
        return content.then((module) => exportContent(_exports, module.default || module));
      } else {
        exportContent(_exports, content);
      }
    },
  }));
}

function exportContent(exportModule: ModuleExport, content: any) {
  if (typeof content === 'function') {
    exportModule('__esModule', true);
    Object.keys(content).forEach((property) => exportModule(property, content[property]));
    exportModule('default', content);
  } else if (
    typeof content === 'number' ||
    typeof content === 'boolean' ||
    typeof content === 'symbol' ||
    typeof content === 'string' ||
    typeof content === 'bigint' ||
    Array.isArray(content)
  ) {
    exportModule('__esModule', true);
    exportModule('default', content);
  } else if (content) {
    exportModule(content);

    if (typeof content === 'object' && !('default' in content)) {
      exportModule('default', content);
    }
  }
}

function registerDependencies(system: PicardSystem, dependencies: Array<[string, ModuleResolver]> = []) {
  for (const [name, dependency] of dependencies) {
    if (!system.has(name)) {
      registerModule(system, name, dependency);
    }
  }
}

/**
 * Registers the given dependency URLs in Picard's module registry.
 * @param dependencyUrls The dependencies to resolve later.
 */
export function registerDependencyUrls(system: PicardSystem, dependencyUrls: Record<string, string> = {}) {
  const dependencies = Object.entries(dependencyUrls).map(([name, url]): [string, ModuleResolver] => [
    name,
    () => system.import(url),
  ]);
  registerDependencies(system, dependencies);
}

/**
 * Registers the given dependency resolvers in Picard's module registry.
 * @param dependencies The dependencies to resolve later.
 */
export function registerDependencyResolvers(system: PicardSystem, dependencies: Record<string, ModuleResolver> = {}) {
  registerDependencies(system, Object.entries(dependencies));
}

/**
 * Imports a module via Picard's module registry.
 * @param url The link to the module's root module.
 * @returns The evaluated module or an empty module in case of an error.
 */
export async function loadModule(system: PicardSystem, url: string) {
  try {
    return await system.import(url);
  } catch (error: any) {
    return handleFailure(error, url);
  }
}
