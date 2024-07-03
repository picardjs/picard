import { loadJson, loadScript } from './utils';
import type { NativeFederationEntry, NativeFederationExposedEntry, ContainerService } from '@/types';

interface NativeFederationManifest {
  name: string;
  shared: Array<string>;
  exposes: Array<NativeFederationExposedEntry>;
}

async function getShimport() {
  const marker = '__shimport__';

  if (marker in globalThis) {
    return globalThis[marker];
  }

  await loadScript('https://unpkg.com/shimport');
  return globalThis[marker];
}

export function createNativeFederation(): ContainerService {
  return {
    async createContainer(entry: NativeFederationEntry) {
      let exposes = entry.exposes;

      if (!exposes) {
        const manifest = await loadJson<NativeFederationManifest>(entry.url);
        exposes = manifest.exposes;
      }

      const names = exposes.map((m) => m.key.substring(2));

      return {
        async load(name: string) {
          const key = `./${name}`;
          const item = exposes?.find((m) => m.key === key);

          if (item) {
            const entryUrl = new URL(item.outFileName, entry.url);
            const shimport = await getShimport();
            const component = await shimport.load(entryUrl.href);
            return component?.default || component;
          }

          return undefined;
        },
        getNames() {
          return names;
        },
        getAssets() {
          return [];
        },
      };
    },
  };
}
