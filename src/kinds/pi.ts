import { loadJson, loadModule, registerDependencyUrls } from './utils';
import type { ComponentLifecycle } from '../types';

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
 * @param url The URL leading to the manifest.
 * @returns The factory to retrieve exposed components.
 */
export async function withPilet(url: string) {
  const manifest = await loadJson<PiletManifest>(url);
  const { main, dependencies = {}, config = {}, ...data } = manifest;
  const link = new URL(main, url);
  const basePath = new URL('.', link.href);

  registerDependencyUrls(dependencies);
  const app = await loadModule(link.href);
  const components = {};

  if (app && 'setup' in app) {
    await app.setup({
      registerComponent(name: string, lifecycle: ComponentLifecycle) {
        components[name] = lifecycle;
      },
    });
  }

  return {
    ...data,
    dependencies,
    config,
    link: link.href,
    basePath: basePath.href,
    app,
    get(name: string) {
      return components[name];
    },
  };
}
