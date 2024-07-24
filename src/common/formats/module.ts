import { getUrl } from '@/common/utils/url';
import type {
  ModuleFederationEntry,
  ModuleFederationContainer,
  ModuleFederationFactoryScope,
  ModuleFederationManifestV2,
  DependencyInjector,
  LoaderService,
  ModuleResolver,
  ContainerService,
  PlatformService,
  AssetDefinition,
  ComponentDefinition,
  ComponentGetter,
  ModuleFederationManifestV2MetaData,
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

async function loadRemoteEntryPoint(
  platform: PlatformService,
  url: string,
  type: string,
  globalName: string,
): Promise<ModuleFederationContainer> {
  switch (type) {
    case 'module':
    case 'esm':
      return await platform.loadModule(url);
    case 'global':
    case 'var':
    default:
      await platform.loadScript(url);
      const remote = window[globalName];

      if (!remote) {
        throw new Error(`The remote "${globalName}" was not found in "${url}".`);
      }

      return remote;
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

function reassign(meta: ModuleFederationManifestV2MetaData, entry: ModuleFederationEntry) {
  const { globalName, remoteEntry } = meta;
  const { name, type, path } = remoteEntry;
  const file = `${path || '.'}/${name}`;
  entry.url = getUrl(file, entry.url);
  entry.type = type;
  entry.id = globalName;
}

async function loadRemote(platform: PlatformService, entry: ModuleFederationEntry) {
  if (entry.url.endsWith('.json')) {
    if (!entry.metaData) {
      const manifest = await platform.loadJson<ModuleFederationManifestV2>(entry.url);
      entry.exposes = manifest.exposes;
      entry.shared = manifest.shared;
      entry.remotes = manifest.remotes;
      entry.metaData = manifest.metaData;
    }

    reassign(entry.metaData, entry);
  }

  return await loadRemoteEntryPoint(platform, entry.url, entry.type, entry.id);
}

async function loadContainerV2(
  platform: PlatformService,
  loader: LoaderService,
  entry: ModuleFederationEntry,
): Promise<ComponentGetter> {
  const assets: Array<AssetDefinition> = [];
  const components: Array<ComponentDefinition> = [];
  const componentRefs: Record<string, { component: undefined | Promise<any> }> = {};
  const remote = await loadRemote(platform, entry);
  const container = await loadFactory(loader, remote, entry);

  for (const item of entry.exposes) {
    const name = item.name;
    components.push({ name });
    componentRefs[name] = { component: undefined };

    for (const path of item.assets.css.sync) {
      assets.push({
        type: 'css',
        url: getUrl(path, entry.url),
      });
    }
  }

  return {
    async load(name) {
      const componentRef = componentRefs[name];

      if (!componentRef) {
        return undefined;
      }

      if (!componentRef.component) {
        componentRef.component = container
          .get(name)
          .then((factory) => factory())
          .then((c) => c?.default || c);
      }

      return await componentRef.component;
    },
    getComponents() {
      return components;
    },
    getAssets() {
      return assets;
    },
  };
}

async function loadContainerV1(
  platform: PlatformService,
  loader: LoaderService,
  entry: ModuleFederationEntry,
): Promise<ComponentGetter> {
  const componentRefs: Record<string, { component: undefined | Promise<any> }> = {};
  const { id, url, type } = entry;
  const varName = id.replace(/^@/, '').replace('/', '-').replace(/\-/g, '_');
  const remote = await loadRemoteEntryPoint(platform, url, type, varName);
  const container = await loadFactory(loader, remote, entry);

  return {
    async load(name) {
      let componentRef = componentRefs[name];

      if (!componentRef) {
        componentRef = {
          component: container
            .get(name)
            .then((factory) => factory())
            .then((c) => c?.default || c)
            .catch(() => undefined),
        };

        componentRefs[name] = componentRef;
      }

      return await componentRef.component;
    },
    getComponents() {
      return [];
    },
    getAssets() {
      return [];
    },
  };
}

function getRuntime(entry: ModuleFederationEntry) {
  const r = entry.runtime;

  if (r) {
    return r;
  } else if (!entry.id || entry.url.endsWith('.json')) {
    return '2.0';
  } else {
    return '1.0';
  }
}

function loadContainer(
  platform: PlatformService,
  loader: LoaderService,
  entry: ModuleFederationEntry,
): Promise<ComponentGetter> {
  switch (getRuntime(entry)) {
    case '2.0':
      return loadContainerV2(platform, loader, entry);
    case '1.0':
    case '1.5':
    default:
      return loadContainerV1(platform, loader, entry);
  }
}

export function createModuleFederation(injector: DependencyInjector): ContainerService {
  const loader = injector.get('loader');
  const platform = injector.get('platform');

  return {
    createContainer(entry: ModuleFederationEntry) {
      return loadContainer(platform, loader, entry);
    },
  };
}
