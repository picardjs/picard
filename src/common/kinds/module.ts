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

const root = '__picard__';

function populateKnownDependencies(scope: ModuleFederationFactoryScope, dependencies: Array<DependencyModule>) {
  // SystemJS to MF
  for (const { name, version, get } of dependencies) {
    if (!(name in scope)) {
      scope[name] = {};
    }

    scope[name][version] = {
      from: root,
      loaded: false,
      eager: false,
      strategy: 'loaded-first',
      version,
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

      if (entry.from !== root) {
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
  populateKnownDependencies(scope, loader.list());
  container.init(scope);
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
          } catch (e) {
            console.log('ERROR', e);
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
