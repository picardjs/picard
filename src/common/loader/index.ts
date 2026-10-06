import { satisfies, validate } from './version';
import { loadModule, registerDependencyResolvers, registerDependencyUrls } from './utils';
import { System } from './system';
import type { DependencyInjector, DependencyModule, LoaderService } from '@/types';

function getLoadedVersions(prefix: string) {
  return [...System.entries()]
    .filter(([name]) => name.startsWith(prefix))
    .map(([name]) => name.substring(prefix.length));
}

function findMatchingPackage(id: string) {
  const sep = id.indexOf('@', 1);

  if (sep > 1) {
    const available = Object.keys(System.registerRegistry);
    const name = id.substring(0, sep + 1);
    const versionSpec = id.substring(sep + 1);

    if (validate(versionSpec)) {
      const loadedVersions = getLoadedVersions(name);
      const allVersions = available.filter((m) => m.startsWith(name)).map((m) => m.substring(name.length));
      // Moves the loaded versions to the top
      const availableVersions = [...loadedVersions, ...allVersions.filter((m) => !loadedVersions.includes(m))];

      for (const availableVersion of availableVersions) {
        if (validate(availableVersion) && satisfies(availableVersion, versionSpec)) {
          return name + availableVersion;
        }
      }
    }
  }

  return undefined;
}

export function createLoader(injector: DependencyInjector): LoaderService {
  const events = injector.get('events');
  const { dependencies } = injector.get('config');

  System.setResolveFallback((id) => findMatchingPackage(id));
  System.setResolveListener((id, parentUrl, result) => events.emit('resolved-dependency', { id, parentUrl, result }));

  registerDependencyResolvers(dependencies);

  return {
    registerUrls(dependencies) {
      registerDependencyUrls(dependencies);
    },
    registerResolvers(dependencies) {
      registerDependencyResolvers(dependencies);
    },
    registerModule(url, content) {
      System.set(url, content);
    },
    load(url) {
      return loadModule(url);
    },
    import(entry, parent) {
      return System.import(entry, parent);
    },
    list() {
      const dependencies: Array<DependencyModule> = [];

      for (const id of Object.keys(System.registerRegistry)) {
        const index = id.lastIndexOf('@');

        if (index > 0 && !id.match(/^https?:\/\//)) {
          const name = id.substring(0, index);
          const version = id.substring(index + 1);

          dependencies.push({
            id,
            name,
            version,
          });
        }
      }

      return dependencies;
    },
  };
}
