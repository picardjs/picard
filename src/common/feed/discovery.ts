import { createEmptyMicrofrontend } from '@/common/utils/dto';
import type { DiscoveryResponse, MicroFrontendDefinition, PicardMicrofrontend } from '@/types';

function inferKind(definition: MicroFrontendDefinition): PicardMicrofrontend['format'] {
  const spec = definition.extras?.pilet.spec;

  if (spec === 'mf') {
    return 'module';
  } else if (spec === 'nf') {
    return 'native';
  } else if (typeof spec === 'string') {
    return 'pilet';
  } else if (definition.url.endsWith('.js') || typeof definition.extras?.modulefederation === 'object') {
    return 'module';
  } else if (definition.url.endsWith('.json') || typeof definition.extras?.nativefederation === 'object') {
    return 'native';
  }

  // by default assume module federation
  return 'module';
}

export function fromDiscovery(feed: DiscoveryResponse): Array<PicardMicrofrontend> {
  const mfs = feed.microFrontends || {};

  return Object.entries(mfs)
    .filter(([, definitions]) => Array.isArray(definitions) && definitions.length > 0)
    .map(([name, definitions]) => {
      const [definition] = definitions;
      const kind = inferKind(definition);

      if (kind === 'module') {
        return createEmptyMicrofrontend(name, kind, definition.url, {
          id: definition.extras?.id || name,
          url: definition.url,
        });
      } else if (kind === 'native') {
        return createEmptyMicrofrontend(name, kind, definition.url, {
          url: definition.url,
          exposes: definition.extras?.exposes,
        });
      } else {
        return createEmptyMicrofrontend(name, kind, definition.url, {
          name,
          link: definition.url,
          url: definition.url,
          spec: definition.extras?.pilet.spec,
        });
      }
    });
}
