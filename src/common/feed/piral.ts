import { getUrl } from '@/common/utils/url';
import { createEmptyMicrofrontend } from '@/common/utils/dto';
import type { PicardMicrofrontend, PiletDefinition } from '@/types';

export function fromPiral(pilet: PiletDefinition, baseUrl?: string): PicardMicrofrontend {
  switch (pilet.spec) {
    case 'mf':
      return createEmptyMicrofrontend(pilet.name, 'module', pilet.link, {
        id: pilet.custom?.id || pilet.name,
        url: getUrl(pilet.link, baseUrl),
      });
    case 'nf':
      return createEmptyMicrofrontend(pilet.name, 'native', pilet.link, {
        exposes: pilet.custom.exposes,
        url: getUrl(pilet.link, baseUrl),
      });
    default:
      return createEmptyMicrofrontend(pilet.name, 'pilet', pilet.link, {
        name: pilet.name,
        integrity: pilet.integrity,
        custom: pilet.custom,
        version: pilet.version,
        dependencies: pilet.dependencies || {},
        spec: pilet.spec,
        config: pilet.config,
        url: getUrl(pilet.link, baseUrl),
      });
  }
}
