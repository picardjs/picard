import { createEmptyMicrofrontend } from '@/common/utils/dto';
import type { PicardMicrofrontend, PiletDefinition } from '@/types';

export function fromPiral(pilet: PiletDefinition): PicardMicrofrontend {
  switch (pilet.spec) {
    case 'mf':
      return createEmptyMicrofrontend(pilet.name, 'module', pilet.link, {
        id: pilet.custom?.id || pilet.name,
        url: pilet.link,
      });
    case 'nf':
      return createEmptyMicrofrontend(pilet.name, 'native', pilet.link, {
        url: pilet.link,
        exposes: pilet.custom.exposes,
      });
    default:
      return createEmptyMicrofrontend(pilet.name, 'pilet', pilet.link, {
        ...pilet,
        url: pilet.link,
      });
  }
}
