import { loadJson } from './utils';

interface NativeFederationExposedEntry {
  key: string;
  outFileName: string;
}

interface NativeFederationManifest {
  name: string;
  shared: Array<string>;
  exposes: Array<NativeFederationExposedEntry>;
}

/**
 * Loads the micro frontend from native federation.
 * @param url The URL leading to the remote entry.
 * @returns The factory to retrieve exposed components.
 */
export async function withNativeFederation(url: string) {
  const manifest = await loadJson<NativeFederationManifest>(url);
  const { name, shared, exposes } = manifest;

  return {
    name,
    shared,
    exposes,
    get(id: string) {
      const key = `./${id}`;
      const entry = exposes.find((m) => m.key === key);

      if (entry) {
        const entryUrl = new URL(entry.outFileName, url);
        return import(entryUrl.href);
      }

      return Promise.resolve(undefined);
    },
  };
}
