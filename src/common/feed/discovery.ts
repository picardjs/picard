import { getUrl } from '@/common/utils/url';
import { createEmptyMicrofrontend } from '@/common/utils/dto';
import type { DiscoveryResponse, PicardMicrofrontend } from '@/types';

function inferKind(url: string, extras: any): PicardMicrofrontend['format'] {
  const spec = extras.pilet.spec;

  if (spec === 'mf') {
    return 'module';
  } else if (spec === 'nf') {
    return 'native';
  } else if (typeof spec === 'string') {
    return 'pilet';
  } else if (url.endsWith('.js') || typeof extras.modulefederation === 'object') {
    return 'module';
  } else if (url.endsWith('.json') || typeof extras.nativefederation === 'object') {
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
      const { metadata, extras = {}, url } = definition;
      const kind = inferKind(url, extras);

      if (kind === 'module') {
        return createEmptyMicrofrontend(name, kind, url, {
          id: extras.id || name,
          url: getUrl(url, baseUrl),
          type: extras.type,
          runtime: extras.runtime,
          exposes: extras.exposes,
          remotes: extras.remotes,
          shared: extras.shared,
          metaData: extras.metaData,
        });
      } else if (kind === 'native') {
        return createEmptyMicrofrontend(name, kind, url, {
          url: getUrl(url, baseUrl),
          exposes: extras.exposes,
          dependencies: extras.dependencies,
        });
      } else {
        return createEmptyMicrofrontend(name, kind, url, {
          name,
          integrity: metadata.integrity,
          version: metadata.version,
          dependencies: extras.dependencies || {},
          config: extras.config,
          spec: extras.pilet.spec,
          url: getUrl(url, baseUrl),
        });
      }
    });
}
