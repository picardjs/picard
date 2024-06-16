import { createLazyLifecycle } from './lifecycle';
import { loadJson } from './utils';
import type { ComponentGetter, ComponentLifecycle, DependencyInjector, PiletApi, PiletEntry } from '../types';

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

/**
 * Loads the micro frontend from a pilet.
 * @param entry The pilet to fully load.
 * @returns The factory to retrieve exposed components.
 */
export async function withPilet(injector: DependencyInjector, entry: PiletEntry): Promise<ComponentGetter> {
  const loader = injector.get('loader');
  const plugins = injector.getAll('pilet');
  const components = {};
  let link = entry.url;

  if (!entry.name) {
    const manifest = await loadJson<PiletManifest>(entry.url);
    const { main, dependencies = {} } = manifest;
    link = new URL(main, entry.url).href;
    loader.registerUrls(dependencies);
  }

  const app = await loader.load(link);

  if (app && 'setup' in app) {
    const basePath = new URL('.', link);
    const api: PiletApi = {
      meta: {
        basePath: basePath.href,
      },
      registerComponent(name: string, component: ComponentLifecycle) {
        components[name] = typeof component === 'function' ? createLazyLifecycle(component) : component;
      },
    };

    plugins.forEach(plugin => plugin.extend(api));
    await app.setup(api);
  }

  return {
    async load(name) {
      return components[name];
    },
  };
}
