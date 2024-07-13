import { getUrl } from '@/common/utils/url';
import type {
  NativeFederationEntry,
  NativeFederationManifest,
  ContainerService,
  DependencyInjector,
  AssetDefinition,
  ComponentDefinition,
} from '@/types';

export function createNativeFederation(injector: DependencyInjector): ContainerService {
  const loader = injector.get('loader');
  const platform = injector.get('platform');
  const esm = injector.get('esm');

  return {
    async createContainer(entry: NativeFederationEntry) {
      let exposes = entry.exposes;
      const depMap: Record<string, string> = {};
      const assets: Array<AssetDefinition> = [];
      const components: Array<ComponentDefinition> = [];
      const componentRefs: Record<string, { url: string; component: undefined | Promise<any> }> = {};

      if (!exposes) {
        const manifest = await platform.loadJson<NativeFederationManifest>(entry.url);
        exposes = manifest.exposes;

        if (manifest.shared.length > 0) {
          loader.registerResolvers(
            manifest.shared.reduce((p, c) => {
              const depUrl = getUrl(c.outFileName, entry.url);
              const id = `${c.packageName}@${c.version}`;
              depMap[c.packageName] = `${c.packageName}@${c.requiredVersion}`;
              p[id] = () => esm.load(depUrl, depMap);
              return p;
            }, {}),
          );
        }
      }

      for (const { key, outFileName } of exposes) {
        const name = key.substring(2);

        if (/\.m?js$/.test(outFileName)) {
          components.push({ name });
          componentRefs[name] = {
            url: getUrl(outFileName, entry.url),
            component: undefined,
          };
        } else if (/\.css$/.test(outFileName)) {
          assets.push({
            url: getUrl(outFileName, entry.url),
            type: 'css',
          });
        }
      }

      return {
        async load(key: string) {
          const name = key.startsWith('./') ? key.substring(2) : key;
          const componentRef = componentRefs[name];

          if (!componentRef) {
            return undefined;
          }

          if (!componentRef.component) {
            componentRef.component = esm.load(componentRef.url, depMap).then((c) => c?.default || c);
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
    },
  };
}
