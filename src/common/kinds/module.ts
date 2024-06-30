import { loadScript } from './utils';
import type {
  ModuleFederationEntry,
  ModuleFederationContainer,
  ModuleFederationFactoryScope,
  DependencyInjector,
  LoaderService,
  ModuleResolver,
  DependencyModule,
  ContainerService,
} from '@/types';

const appShell = 'app';

function populateKnownDependencies(scope: ModuleFederationFactoryScope, dependencies: Array<DependencyModule>) {
  // SystemJS to MF
  for (const { name, version, get } of dependencies) {
    if (!(name in scope)) {
      scope[name] = {};
    }

    scope[name][version] = {
      from: appShell,
      eager: false,
      get,
    };
  }
}

function extractSharedDependencies(scope: ModuleFederationFactoryScope) {
  const dependencies: Record<string, ModuleResolver> = {};

  // MF to SystemJS
  for (const entryName of Object.keys(scope)) {
    const entries = scope[entryName];

    for (const entryVersion of Object.keys(entries)) {
      const entry = entries[entryVersion];

      if (entry.from !== appShell) {
        dependencies[`${entryName}@${entryVersion}`] = () => entry.get().then((factory) => factory());
      }
    }
  }

  return dependencies;
}

function loadFactory(loader: LoaderService, name: string) {
  const varName = name.replace(/^@/, '').replace('/', '-').replace(/\-/g, '_');
  const container: ModuleFederationContainer = window[varName];
  const scope: ModuleFederationFactoryScope = {};
  container.init(scope);
  populateKnownDependencies(scope, loader.list());
  loader.registerResolvers(extractSharedDependencies(scope));
  return container;
}

export function createModuleFederation(injector: DependencyInjector): ContainerService {
  const loader = injector.get('loader');

  return {
    async createContainer(entry: ModuleFederationEntry) {
      await loadScript(entry.url);
      const container = loadFactory(loader, entry.id);
      return {
        async load(name) {
          try {
            const factory = await container.get(name);
            const component = factory();
            return component.default || component;
          } catch {
            return undefined;
          }
        },
        getNames() {
          return [];
        },
        getAssets() {
          return [];
        },
      };
    },
  };
}
