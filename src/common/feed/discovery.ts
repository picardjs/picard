import type { DiscoveryResponse, PicardMicrofrontend } from '@/types';

export function fromDiscovery(feed: DiscoveryResponse): Array<PicardMicrofrontend> {
  const mfs = feed.microFrontends || {};

  return Object.entries(mfs)
    .filter(([, definitions]) => Array.isArray(definitions) && definitions.length > 0)
    .map(([name, definitions]) => {
      const [definition] = definitions;
      const kind = definition.extras?.pilet.spec;

      if (kind === undefined || kind === 'module') {
        return {
          components: {},
          details: {
            id: definition.extras?.id || name,
            url: definition.url,
          },
          kind: 'module',
          name,
          source: definition.url,
        };
      } else if (kind === 'nf') {
        return {
          components: {},
          details: {
            url: definition.url,
            exposes: definition.extras?.exposes,
          },
          kind: 'native',
          name,
          source: definition.url,
        };
      } else {
        return {
          components: {},
          details: {
            name,
            link: definition.url,
            url: definition.url,
          },
          kind: 'pilet',
          name,
          source: definition.url,
        };
      }
    });
}
