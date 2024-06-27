import { createEmptyMicrofrontend } from './utils';
import type { DiscoveryResponse, PicardMicrofrontend } from '@/types';

export function fromDiscovery(feed: DiscoveryResponse): Array<PicardMicrofrontend> {
  const mfs = feed.microFrontends || {};

  return Object.entries(mfs)
    .filter(([, definitions]) => Array.isArray(definitions) && definitions.length > 0)
    .map(([name, definitions]) => {
      const [definition] = definitions;
      const kind = definition.extras?.pilet.spec;

      if (kind === undefined || kind === 'mf') {
        return createEmptyMicrofrontend(name, 'module', definition.url, {
          id: definition.extras?.id || name,
          url: definition.url,
        });
      } else if (kind === 'nf') {
        return createEmptyMicrofrontend(name, 'native', definition.url, {
          url: definition.url,
          exposes: definition.extras?.exposes,
        });
      } else {
        return createEmptyMicrofrontend(name, 'pilet', definition.url, {
          name,
          link: definition.url,
          url: definition.url,
        });
      }
    });
}
