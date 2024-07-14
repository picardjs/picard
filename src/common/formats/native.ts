import { getUrl } from '@/common/utils/url';
import type {
  NativeFederationEntry,
  NativeFederationManifest,
  ContainerService,
  DependencyInjector,
  AssetDefinition,
  ComponentDefinition,
  LoaderService,
  EsmService,
} from '@/types';

function setupDependencies(
  loader: LoaderService,
  esm: EsmService,
  entry: NativeFederationEntry,
  depMap: Record<string, string>,
) {
  const { dependencies, url } = entry;

  if (dependencies.length > 0) {
    loader.registerResolvers(
      dependencies.reduce((p, c) => {
        const depUrl = getUrl(c.outFileName, url);
        const id = `${c.packageName}@${c.version}`;
        depMap[c.packageName] = `${c.packageName}@${c.requiredVersion}`;
        p[id] = () => esm.load(depUrl, depMap, url);
        return p;
      }, {}),
    );
  }

  loader.registerModule(url, {});
}

function inspect(entry: NativeFederationEntry) {
  const assets: Array<AssetDefinition> = [];
  const components: Array<ComponentDefinition> = [];
  const componentRefs: Record<string, { url: string; component: undefined | Promise<any> }> = {};
  const { exposes, url } = entry;

  for (const { key, outFileName } of exposes) {
    const name = key.substring(2);

    if (/\.m?js$/.test(outFileName)) {
      components.push({ name });
      componentRefs[name] = {
        url: getUrl(outFileName, url),
        component: undefined,
      };
    } else if (/\.css$/.test(outFileName)) {
      assets.push({
        url: getUrl(outFileName, url),
        type: 'css',
      });
    }
  }

  return [components, componentRefs, assets] as const;
}

export function createNativeFederation(injector: DependencyInjector): ContainerService {
  const loader = injector.get('loader');
  const platform = injector.get('platform');
  const esm = injector.get('esm');

  return {
    async createContainer(entry: NativeFederationEntry) {
      const depMap: Record<string, string> = {};
      const { url } = entry;

      if (!entry.exposes || !entry.dependencies) {
        const manifest = await platform.loadJson<NativeFederationManifest>(url);
        entry.exposes = manifest.exposes;
        entry.dependencies = manifest.shared;
      }

      setupDependencies(loader, esm, entry, depMap);
      const [components, componentRefs, assets] = inspect(entry);

      return {
        async load(key: string) {
          const name = key.startsWith('./') ? key.substring(2) : key;
          const componentRef = componentRefs[name];

          if (!componentRef) {
            return undefined;
          }

          if (!componentRef.component) {
            componentRef.component = esm.load(componentRef.url, depMap, url).then((c) => c?.default || c);
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
