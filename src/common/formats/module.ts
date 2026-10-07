import { createInstance, type ModuleFederation, type ModuleFederationRuntimePlugin } from '@module-federation/runtime';
import { getUrl } from '@/common/utils/url';
import type {
  ModuleFederationEntry,
  ModuleFederationManifestV2,
  DependencyInjector,
  LoaderService,
  ModuleResolver,
  ContainerService,
  PlatformService,
  AssetDefinition,
  ComponentDefinition,
  ComponentGetter,
} from '@/types';

interface RemoteDefinition {
  id: string;
  entry: string;
  type?: string;
  entryGlobalName?: string;
  assetBase: string;
}

async function loadRemote(platform: PlatformService, entry: ModuleFederationEntry): Promise<RemoteDefinition> {
  let id = entry.id;

  if (entry.url.endsWith('.json')) {
    if (!entry.metaData) {
      const manifest = await platform.loadJson<ModuleFederationManifestV2>(entry.url);
      entry.exposes = manifest.exposes;
      entry.shared = manifest.shared;
      entry.remotes = manifest.remotes;
      entry.metaData = manifest.metaData;
    }

    const { globalName, remoteEntry } = entry.metaData;
    entry.id = globalName;
    id = globalName;
    return {
      id,
      entry: entry.url,
      type: remoteEntry.type === 'module' ? 'module' : undefined,
      entryGlobalName: globalName,
      assetBase: getUrl('./', entry.url),
    };
  }

  const type = entry.type === 'esm' ? 'module' : entry.type;
  const entryGlobalName = id.replace(/^@/, '').replace('/', '-').replace(/\-/g, '_');

  return {
    id,
    entry: entry.url,
    type,
    entryGlobalName,
    assetBase: entry.url,
  };
}

function registerPicardShares(
  federation: ModuleFederation,
  loader: LoaderService,
  parent: string,
  registeredShares: Set<string>,
) {
  type Shares = NonNullable<Parameters<ModuleFederation['registerShared']>[0]>;
  type ShareOptions = Exclude<Shares[string], unknown[]>;
  const shares: Record<string, Array<ShareOptions>> = {};

  for (const { id, name, version } of loader.list()) {
    if (registeredShares.has(id)) {
      continue;
    }

    (shares[name] ||= []).push({
      version,
      strategy: 'loaded-first',
      shareConfig: { requiredVersion: false },
      get: async () => async () => loader.import(id, parent),
    });
    registeredShares.add(id);
  }

  if (Object.keys(shares).length > 0) {
    federation.registerShared(shares);
  }
}

function registerFederationShares(federation: ModuleFederation, loader: LoaderService) {
  const existing = new Set(loader.list().map(({ id }) => id));
  const resolvers: Record<string, () => ModuleResolver> = {};

  for (const scope of Object.values(federation.shareScopeMap)) {
    for (const [name, versions] of Object.entries(scope)) {
      for (const [version, share] of Object.entries(versions)) {
        const id = `${name}@${version}`;

        if (!existing.has(id)) {
          resolvers[id] = () => async () => {
            const get = await federation.loadShare(name, {
              resolver: (available) => available.find((item) => item.version === version) || available[0],
            });
            return get && get();
          };
          existing.add(id);
        }
      }
    }
  }

  loader.registerResolvers(resolvers);
}

function registerRemote(federation: ModuleFederation, remote: RemoteDefinition, registeredRemotes: Map<string, string>) {
  const existingEntry = registeredRemotes.get(remote.id);

  if (existingEntry === remote.entry) {
    return;
  }

  const remotes = [
    {
      name: remote.id,
      entry: remote.entry,
      ...(remote.type ? { type: remote.type } : {}),
      ...(remote.entryGlobalName ? { entryGlobalName: remote.entryGlobalName } : {}),
    },
  ];

  if (existingEntry) {
    federation.registerRemotes(remotes, { force: true });
  } else {
    federation.registerRemotes(remotes);
  }

  registeredRemotes.set(remote.id, remote.entry);
}

const legacyExposePlugin: ModuleFederationRuntimePlugin = {
  name: 'picard-legacy-exposes',
  getModuleFactory({ expose, remoteEntryExports }) {
    return (async () => {
      try {
        return await remoteEntryExports.get(expose);
      } catch (error) {
        if (expose.startsWith('./') && error instanceof Error && error.message.includes('does not exist in container')) {
          return remoteEntryExports.get(expose.substring(2));
        }

        throw error;
      }
    })();
  },
};

function loadExposed(federation: ModuleFederation, loader: LoaderService, remote: RemoteDefinition, name: string) {
  return federation.loadRemote(`${remote.id}/${name}`).then((module) => {
    registerFederationShares(federation, loader);
    return (module as any)?.default || module;
  });
}

async function loadContainerV2(
  federation: ModuleFederation,
  platform: PlatformService,
  loader: LoaderService,
  registeredRemotes: Map<string, string>,
  registeredShares: Set<string>,
  entry: ModuleFederationEntry,
): Promise<ComponentGetter> {
  const assets: Array<AssetDefinition> = [];
  const components: Array<ComponentDefinition> = [];
  const componentRefs: Record<string, { component: undefined | Promise<any> }> = {};
  const remote = await loadRemote(platform, entry);

  registerPicardShares(federation, loader, remote.entry, registeredShares);
  registerRemote(federation, remote, registeredRemotes);

  for (const item of entry.exposes || []) {
    const name = item.name;
    components.push({ name });
    componentRefs[name] = { component: undefined };

    for (const path of item.assets.css.sync) {
      assets.push({
        type: 'css',
        url: getUrl(path, remote.assetBase),
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
        componentRef.component = loadExposed(federation, loader, remote, name);
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
  federation: ModuleFederation,
  platform: PlatformService,
  loader: LoaderService,
  registeredRemotes: Map<string, string>,
  registeredShares: Set<string>,
  entry: ModuleFederationEntry,
): Promise<ComponentGetter> {
  const componentRefs: Record<string, { component: undefined | Promise<any> }> = {};
  const remote = await loadRemote(platform, entry);

  registerPicardShares(federation, loader, remote.entry, registeredShares);
  registerRemote(federation, remote, registeredRemotes);

  return {
    async load(name) {
      let componentRef = componentRefs[name];

      if (!componentRef) {
        componentRef = {
          component: loadExposed(federation, loader, remote, name).catch((error) => {
            console.error(`Failed to load federated module "${remote.id}/${name}".`, error);
            return undefined;
          }),
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
  const runtime = entry.runtime;

  if (runtime) {
    return runtime;
  } else if (!entry.id || entry.url.endsWith('.json')) {
    return '2.0';
  } else {
    return '1.0';
  }
}

function loadContainer(
  federation: ModuleFederation,
  platform: PlatformService,
  loader: LoaderService,
  registeredRemotes: Map<string, string>,
  registeredShares: Set<string>,
  entry: ModuleFederationEntry,
): Promise<ComponentGetter> {
  switch (getRuntime(entry)) {
    case '2.0':
      return loadContainerV2(federation, platform, loader, registeredRemotes, registeredShares, entry);
    case '1.0':
    case '1.5':
    default:
      return loadContainerV1(federation, platform, loader, registeredRemotes, registeredShares, entry);
  }
}

export function createModuleFederation(injector: DependencyInjector): ContainerService {
  const loader = injector.get('loader');
  const platform = injector.get('platform');
  const federation = createInstance({ name: 'picard', remotes: [], plugins: [legacyExposePlugin] });
  const registeredRemotes = new Map<string, string>();
  const registeredShares = new Set<string>();

  return {
    createContainer(entry: ModuleFederationEntry) {
      return loadContainer(federation, platform, loader, registeredRemotes, registeredShares, entry);
    },
  };
}