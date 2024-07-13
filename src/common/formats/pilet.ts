import { getUrl } from '@/common/utils/url';
import type {
  AssetDefinition,
  ComponentDefinition,
  ContainerService,
  DependencyInjector,
  PiletApi,
  PiletEntry,
} from '@/types';

interface PiletManifest {
  name: string;
  version: string;
  description: string;
  author: {
    name: string;
    email: string;
  };
  config?: Record<string, any>;
  dependencies?: Record<string, string>;
  main: string;
  spec: 'v2';
}

export function createPilet(injector: DependencyInjector): ContainerService {
  const loader = injector.get('loader');
  const plugins = injector.getAll('pilet');
  const platform = injector.get('platform');

  return {
    async createContainer(entry: PiletEntry) {
      const components: Array<ComponentDefinition> = [];
      const componentRefs: Record<string, any> = {};
      const assets: Array<AssetDefinition> = [];
      let link = entry.url;

      if (!entry.name) {
        const manifest = await platform.loadJson<PiletManifest>(entry.url);
        const { main, dependencies = {} } = manifest;
        link = getUrl(main, entry.url);
        loader.registerUrls(dependencies);
      } else {
        const { dependencies = {} } = entry;
        loader.registerUrls(dependencies);
      }

      const app = await loader.load(link);

      if (app && 'setup' in app) {
        const basePath = getUrl('.', link);
        const api: PiletApi = {
          meta: {
            basePath,
          },
          registerComponent(name: string, component: any, opts: any = {}) {
            const { type, ...rest } = opts;
            const meta = { ...rest, api };
            componentRefs[name] = component;
            components.push({ name, type, meta });
          },
        };

        if (Array.isArray(app.styles)) {
          const styleSheets = app.styles.map((style) => ({
            url: getUrl(style, basePath),
            type: 'css',
          }));
          assets.push(...styleSheets);
        }

        plugins.forEach((plugin) => plugin.extend(api));
        await app.setup(api);
      }

      return {
        async load(name) {
          return componentRefs[name];
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
