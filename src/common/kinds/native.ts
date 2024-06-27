import { loadJson } from './utils';
import type { NativeFederationEntry, NativeFederationExposedEntry, ContainerService } from '@/types';

interface NativeFederationManifest {
  name: string;
  shared: Array<string>;
  exposes: Array<NativeFederationExposedEntry>;
}

export function createNativeFederation(): ContainerService {
  return {
    async createContainer(entry: NativeFederationEntry) {
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
            // @ts-ignore
            const component = await import(/* @vite-ignore */ entryUrl.href);
            return component?.default || component;
          }

          return undefined;
        },
        getAssets() {
          return [];
        },
      };
    },
  };
}
