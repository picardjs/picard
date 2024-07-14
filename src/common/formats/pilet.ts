import { getUrl } from '@/common/utils/url';
import type {
  AssetDefinition,
  ComponentDefinition,
  ContainerService,
  DependencyInjector,
  PiletManifest,
  PiletApi,
  PiletEntry,
} from '@/types';

export function createPilet(injector: DependencyInjector): ContainerService {
  const loader = injector.get('loader');
  const plugins = injector.getAll('pilet');
  const platform = injector.get('platform');

  return {
    async createContainer(entry: PiletEntry) {
      const components: Array<ComponentDefinition> = [];
      const componentRefs: Record<string, any> = {};
      const assets: Array<AssetDefinition> = [];

      if (!entry.name) {
        const manifest = await platform.loadJson<PiletManifest>(entry.url);
        const { name, version, main, dependencies = {}, spec, config } = manifest;
        const url = getUrl(main, entry.url);
        Object.assign(entry, { name, version, dependencies, spec, config, url });
      }

      loader.registerUrls(entry.dependencies);
      const app = await loader.load(entry.url);

      if (app && 'setup' in app) {
        const basePath = getUrl('.', entry.url);
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
