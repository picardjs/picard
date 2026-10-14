import type { ModuleFederationService } from './module';
import type { ContainerService, DependencyInjector, ModuleFederationEntry } from '@/types';

/**
 * Creates a Module Federation format that only loads the Module Federation
 * runtime when a federated container or a shared version range is requested.
 */
export function createLazyModuleFederation(injector: DependencyInjector): ContainerService {
  const loader = injector.get('loader');
  let service: Promise<ModuleFederationService> | undefined;

  const load = () => {
    if (!service) {
      service = import('./module').then(({ createModuleFederation }) => createModuleFederation(injector));
    }

    return service;
  };

  // the real service replaces this resolver once loaded
  loader.setPackageResolver(async (name, versionRange, parent) => {
    const federation = await load();
    return await federation.resolvePackage(name, versionRange, parent);
  });

  return {
    async createContainer(entry: ModuleFederationEntry) {
      const federation = await load();
      return await federation.createContainer(entry);
    },
  };
}
