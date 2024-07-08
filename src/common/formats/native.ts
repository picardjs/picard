import type {
  NativeFederationEntry,
  NativeFederationExposedEntry,
  ContainerService,
  DependencyInjector,
  PlatformService,
} from '@/types';

interface NativeFederationManifest {
  name: string;
  shared: Array<{
    packageName: string;
    outFileName: string;
    requiredVersion: string;
    singleton: boolean;
    strictVersion: boolean;
    version: string;
  }>;
  exposes: Array<NativeFederationExposedEntry>;
}

async function getShimport(platform: PlatformService) {
  const marker = '__shimport__';

  if (marker in globalThis) {
    return globalThis[marker];
  }

  await platform.loadScript('./dist/picard-esm.js');
  return globalThis[marker];
}

export function createNativeFederation(injector: DependencyInjector): ContainerService {
  const loader = injector.get('loader');
  const platform = injector.get('platform');

  return {
    async createContainer(entry: NativeFederationEntry) {
      let exposes = entry.exposes;
      const shimport = await getShimport(platform);
      const depMap: Record<string, string> = {};

      if (!exposes) {
        const manifest = await platform.loadJson<NativeFederationManifest>(entry.url);
        exposes = manifest.exposes;

        if (manifest.shared.length > 0) {
          loader.registerResolvers(
            manifest.shared.reduce((p, c) => {
              const depUrl = new URL(c.outFileName, entry.url);
              const id = `${c.packageName}@${c.version}`;
              depMap[c.packageName] = `${c.packageName}@${c.requiredVersion}`;
              p[id] = () => shimport.load(depUrl.href, depMap);
              return p;
            }, {}),
          );
        }
      }

      const names = exposes.map((m) => m.key.substring(2));

      return {
        async load(name: string) {
          const key = `./${name}`;
          const item = exposes?.find((m) => m.key === key);

          if (item) {
            const entryUrl = new URL(item.outFileName, entry.url);
            const component = await shimport.load(entryUrl.href, depMap);
            return component?.default || component;
          }

          return undefined;
        },
        getNames() {
          return names;
        },
        getAssets() {
          return [];
        },
      };
    },
  };
}
