import { loadJson } from './utils';
import type {
  NativeFederationEntry,
  NativeFederationExposedEntry,
  ComponentGetter,
  DependencyInjector,
} from '../types';

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
export async function withNativeFederation(
  injector: DependencyInjector,
  entry: NativeFederationEntry,
): Promise<ComponentGetter> {
  let exposes = entry.exposes;

  if (!exposes) {
    const manifest = await loadJson<NativeFederationManifest>(entry.url);
    exposes = manifest.exposes;
  }

  return {
    async load(name: string) {
      const key = `./${name}`;
      const item = exposes?.find((m) => m.key === key);

      if (item) {
        const entryUrl = new URL(item.outFileName, entry.url);
        const component = await import(entryUrl.href);
        return component?.default || component;
      }

      return undefined;
    },
  };
}
