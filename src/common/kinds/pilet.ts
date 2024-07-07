import { createLazyLifecycle } from './lifecycle';
import type { ContainerService, DependencyInjector, PiletApi, PiletEntry } from '@/types';

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
      const components = {};
      const assets = [];
      let link = entry.url;

      if (!entry.name) {
        const manifest = await platform.loadJson<PiletManifest>(entry.url);
        const { main, dependencies = {} } = manifest;
        link = new URL(main, entry.url).href;
        loader.registerUrls(dependencies);
      } else {
        const { dependencies = {} } = entry;
        loader.registerUrls(dependencies);
      }

      const app = await loader.load(link);

      if (app && 'setup' in app) {
        const basePath = new URL('.', link);
        const api: PiletApi = {
          meta: {
            basePath: basePath.href,
          },
          registerComponent(name: string, component: any, opts: any = {}) {
            const { type = '', ...rest } = opts;
            const framework = type && injector.get(`framework.${type}`);
            const lc = framework ? framework.convert(component, { ...rest, api }) : component;
            components[name] = typeof lc === 'function' ? createLazyLifecycle(lc, name) : lc;
          },
        };

        if (Array.isArray(app.styles)) {
          const styleSheets = app.styles.map((style) => ({
            url: new URL(style, basePath).href,
            type: 'css',
          }));
          assets.push(...styleSheets);
        }

        plugins.forEach((plugin) => plugin.extend(api));
        await app.setup(api);
      }

      return {
        async load(name) {
          return components[name];
        },
        getNames() {
          return Object.keys(components);
        },
        getAssets() {
          return assets;
        }
      };
    },
  };
}
