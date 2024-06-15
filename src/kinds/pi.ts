import { createLazyLifecycle } from './lifecycle';
import { loadJson, loadModule, registerDependencyUrls } from './utils';
import type { ComponentGetter, ComponentLifecycle, PiletEntry } from '../types';

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
export async function withPilet(entry: PiletEntry): Promise<ComponentGetter> {
  const components = {};
  let link = entry.url;

  if (!entry.name) {
    const manifest = await loadJson<PiletManifest>(entry.url);
    const { main, dependencies = {} } = manifest;
    link = new URL(main, entry.url).href;
    registerDependencyUrls(dependencies);
  }
  
  const app = await loadModule(link);

  if (app && 'setup' in app) {
    const basePath = new URL('.', link);

    await app.setup({
      meta: {
        basePath: basePath.href,
      },
      registerComponent(name: string, component: ComponentLifecycle) {
        components[name] = typeof component === 'function' ? createLazyLifecycle(component) : component;
      },
    });
  }

  return {
    async load(name) {
      return components[name];
    },
  };
}
