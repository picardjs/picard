import type {
  ModuleFederationEntry,
  ModuleFederationContainer,
  ModuleFederationFactoryScope,
  DependencyInjector,
  LoaderService,
  ModuleResolver,
  ContainerService,
  PlatformService,
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

async function loadRemote(platform: PlatformService, entry: ModuleFederationEntry): Promise<ModuleFederationContainer> {
  const { id, url, type } = entry;
  const varName = id.replace(/^@/, '').replace('/', '-').replace(/\-/g, '_');

  switch (type) {
    case 'esm':
      return await platform.loadModule(url);
    case 'var':
    default:
      await platform.loadScript(url);
      return window[varName];
  }
}

async function loadFactory(loader: LoaderService, remote: ModuleFederationContainer, entry: ModuleFederationEntry) {
  const { url } = entry;
  const scope: ModuleFederationFactoryScope = {};
  loader.registerModule(url, remote);
  populateKnownDependencies(url, scope, loader);
  remote.init(scope);
  extractSharedDependencies(url, scope, loader);
  return remote;
}

export function createModuleFederation(injector: DependencyInjector): ContainerService {
  const loader = injector.get('loader');
  const platform = injector.get('platform');

  return {
    async createContainer(entry: ModuleFederationEntry) {
      const remote = await loadRemote(platform, entry);

      if (!remote) {
        throw new Error(`The remote "${entry.id}" was not found in "${entry.url}".`);
      }

      const container = await loadFactory(loader, remote, entry);

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
