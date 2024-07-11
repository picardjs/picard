import type {
  NativeFederationEntry,
  NativeFederationExposedEntry,
  ContainerService,
  DependencyInjector,
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

export function createNativeFederation(injector: DependencyInjector): ContainerService {
  const loader = injector.get('loader');
  const platform = injector.get('platform');
  const esm = injector.get('esm');

  return {
    async createContainer(entry: NativeFederationEntry) {
      let exposes = entry.exposes;
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
              p[id] = () => esm.load(depUrl.href, depMap);
              return p;
            }, {}),
          );
        }
      }

      const names = exposes.map((m) => m.key.substring(2));

      return {
        async load(name: string) {
          const key = name.startsWith('./') ? name : `./${name}`;
          const item = exposes?.find((m) => m.key === key);

          if (item) {
            const entryUrl = new URL(item.outFileName, entry.url);
            const component = await esm.load(entryUrl.href, depMap);
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
