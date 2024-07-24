import { getUrl } from '@/common/utils/url';
import { createEmptyMicrofrontend } from '@/common/utils/dto';
import type { PicardMicrofrontend, PiletDefinition } from '@/types';

export function fromPiral(pilet: PiletDefinition, baseUrl?: string): PicardMicrofrontend {
  const { name, link, spec, custom } = pilet;

  switch (spec) {
    case 'mf':
      return createEmptyMicrofrontend(name, 'module', link, {
        id: custom?.id || name,
        url: getUrl(link, baseUrl),
        type: custom?.type,
        runtime: custom?.runtime,
        exposes: custom?.exposes,
        remotes: custom?.remotes,
        shared: custom?.shared,
        metaData: custom?.metaData,
      });
    case 'nf':
      return createEmptyMicrofrontend(name, 'native', link, {
        url: getUrl(link, baseUrl),
        exposes: custom?.exposes,
        dependencies: custom?.dependencies,
      });
    default:
      return createEmptyMicrofrontend(name, 'pilet', link, {
        name,
        integrity: pilet.integrity,
        custom,
        version: pilet.version,
        dependencies: pilet.dependencies || {},
        spec,
        config: pilet.config,
        url: getUrl(link, baseUrl),
      });
  }
}
