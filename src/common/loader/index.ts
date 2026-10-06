import type { DependencyInjector, LoaderService } from '@/types';

import { createSystem } from './system';
import { loadModule, registerDependencyResolvers, registerDependencyUrls } from './utils';

const system = createSystem();

function createLoader(injector: DependencyInjector): LoaderService {
  const events = injector.get('events');
  const { dependencies } = injector.get('config');

  system.setResolveListener((id, parentUrl, result) => events.emit('resolved-dependency', { id, parentUrl, result }));

  registerDependencyResolvers(system, dependencies);

  return {
    registerUrls(dependencies) {
      registerDependencyUrls(system, dependencies);
    },
    registerResolvers(dependencies) {
      registerDependencyResolvers(system, dependencies);
    },
    registerModule(url, content) {
      system.set(url, content);
    },
    load(url) {
      return loadModule(system, url);
    },
    import(entry, parent) {
      return system.import(entry, parent);
    },
    list() {
      return system.list();
    },
  };
}

(globalThis as any).System = system;

export { system, createLoader };
