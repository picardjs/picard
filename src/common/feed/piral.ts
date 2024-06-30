import { createEmptyMicrofrontend } from '@/common/utils/dto';
import type { PicardMicrofrontend, PiletDefinition } from '@/types';

export function fromPiral(pilet: PiletDefinition): PicardMicrofrontend {
  if (pilet.spec === 'mf') {
    return createEmptyMicrofrontend(pilet.name, 'module', pilet.link, {
      id: pilet.custom?.id,
      url: pilet.link,
    });
  } else if (pilet.spec === 'nf') {
    return createEmptyMicrofrontend(pilet.name, 'native', pilet.link, {
      url: pilet.link,
      exposes: pilet.custom.exposes,
    });
  } else {
    return createEmptyMicrofrontend(pilet.name, 'pilet', pilet.link, {
      ...pilet,
      url: pilet.link,
    });
  }
}
