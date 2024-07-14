import { getUrl } from '@/common/utils/url';
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

export function fromDiscovery(feed: DiscoveryResponse, baseUrl?: string): Array<PicardMicrofrontend> {
  const mfs = feed.microFrontends || {};

  return Object.entries(mfs)
    .filter(([, definitions]) => Array.isArray(definitions) && definitions.length > 0)
    .map(([name, definitions]) => {
      const [definition] = definitions;
      const kind = inferKind(definition);
      const { metadata, extras, url } = definition;

      if (kind === 'module') {
        return createEmptyMicrofrontend(name, kind, url, {
          id: extras?.id || name,
          url: getUrl(url, baseUrl),
        });
      } else if (kind === 'native') {
        return createEmptyMicrofrontend(name, kind, url, {
          exposes: extras?.exposes,
          url: getUrl(url, baseUrl),
        });
      } else {
        return createEmptyMicrofrontend(name, kind, url, {
          name,
          integrity: metadata.integrity,
          version: metadata.version,
          dependencies: extras?.dependencies || {},
          config: extras?.config,
          spec: extras?.pilet.spec,
          url: getUrl(url, baseUrl),

        });
      }
    });
}
