import { loadScript } from './utils';
import type {
  ModuleFederationEntry,
  ModuleFederationContainer,
  ModuleFederationFactoryScope,
  DependencyInjector,
  LoaderService,
  ModuleResolver,
  ContainerService,
} from '@/types';

const root = '__picard__';

function populateKnownDependencies(parent: string, scope: ModuleFederationFactoryScope, loader: LoaderService) {
  const dependencies = loader.list();

  // SystemJS to MF
  for (const { id, name, version } of dependencies) {
    if (!(name in scope)) {
      scope[name] = {};
    }

    scope[name][version] = {
      from: root,
      loaded: false,
      eager: false,
      strategy: 'loaded-first',
      version,
      async get() {
        const result = await loader.import(id, parent);
        return () => result;
      },
    };
  }
}

function extractSharedDependencies(parent: string, scope: ModuleFederationFactoryScope, loader: LoaderService) {
  const dependencies: Record<string, ModuleResolver> = {};

  // MF to SystemJS
  for (const entryName of Object.keys(scope)) {
    const entries = scope[entryName];

    for (const entryVersion of Object.keys(entries)) {
      const entry = entries[entryVersion];

      if (entry.from !== root) {
        const id = `${entryName}@${entryVersion}`;
        const fn = entry.get;
        entry.get = async () => {
          const result = await loader.import(id, parent);
          return () => result;
        };
        dependencies[id] = () => fn.call(entry).then((factory) => factory());
      }
    }
  }

  loader.registerResolvers(dependencies);
}

function loadFactory(loader: LoaderService, entry: ModuleFederationEntry) {
  const { id, url } = entry;
  const varName = id.replace(/^@/, '').replace('/', '-').replace(/\-/g, '_');
  const container: ModuleFederationContainer = window[varName];
  const scope: ModuleFederationFactoryScope = {};
  loader.registerModule(url, container);
  populateKnownDependencies(url, scope, loader);
  container.init(scope);
  extractSharedDependencies(url, scope, loader);
  return container;
}

export function createModuleFederation(injector: DependencyInjector): ContainerService {
  const loader = injector.get('loader');

  return {
    async createContainer(entry: ModuleFederationEntry) {
      await loadScript(entry.url);
      const container = loadFactory(loader, entry);
      return {
        async load(name) {
          try {
            const factory = await container.get(name);
            const component = factory();
            return component.default || component;
          } catch (e) {
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
