import { loadJson } from './utils';
import { registerComponent, retrieveComponent, updateDetails } from '../state';
import type { PicardStore, NativeFederationExposedEntry, NativeFederationPicardMicrofrontend } from '../types';

interface NativeFederationManifest {
  name: string;
  shared: Array<string>;
  exposes: Array<NativeFederationExposedEntry>;
}

/**
 * Loads the micro frontend from native federation.
 * @param entry The native federation entry to fully load.
 * @returns The factory to retrieve exposed components.
 */
export async function withNativeFederation(mf: NativeFederationPicardMicrofrontend, scope: PicardStore) {
  const entry = {
    ...mf.details,
  };

  if (!entry.exposes) {
    const manifest = await loadJson<NativeFederationManifest>(entry.url);
    const { exposes } = manifest;
    entry.exposes = exposes;
  }

  if (!entry.container) {
    entry.container = {
      async load(name: string) {
        const id = mf.components[name];

        if (id) {
          return retrieveComponent(scope, id)?.render;
        }

        const key = `./${name}`;
        const item = entry.exposes?.find((m) => m.key === key);

        if (item) {
          const entryUrl = new URL(item.outFileName, entry.url);
          const component = await import(entryUrl.href);
          const lifecycle = component?.default || component;
          registerComponent(scope, mf, name, lifecycle);
          return lifecycle;
        }

        mf.components[name] = 'void';
        return undefined;
      },
    };

    updateDetails(scope, mf, entry);
  }

  return entry.container;
}
