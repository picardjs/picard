import { registerComponent, retrieveComponent, updateDetails } from '../state';
import { loadJson, loadModule, registerDependencyUrls } from './utils';
import type { ComponentLifecycle, PicardStore, PiletPicardMicrofrontend } from '../types';

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
export async function withPilet(mf: PiletPicardMicrofrontend, scope: PicardStore) {
  const entry = {
    ...mf.details,
  };

  if (!entry.name) {
    const manifest = await loadJson<PiletManifest>(entry.url);
    const { main, dependencies = {}, config = {}, ...data } = manifest;
    const link = new URL(main, entry.url);
    registerDependencyUrls(dependencies);
    Object.assign(entry, data);
    entry.link = link.href;
  }

  if (!entry.container) {
    const url = entry.link || entry.url;
    const app = await loadModule(url);

    if (app && 'setup' in app) {
      const basePath = new URL('.', url);

      await app.setup({
        meta: {
          basePath: basePath.href,
        },
        registerComponent(name: string, lifecycle: ComponentLifecycle) {
          registerComponent(scope, mf, name, lifecycle);
        },
      });
    }

    entry.container = {
      async load(name: string) {
        const id = mf.components[name];

        if (id) {
          return retrieveComponent(scope, id)?.render;
        }

        return undefined;
      },
    };

    updateDetails(scope, mf, entry);
  }

  return entry.container;
}
