import type { PicardMicrofrontend, PiletDefinition } from '@/types';

export function fromPiral(pilet: PiletDefinition): PicardMicrofrontend {
  if (pilet.spec === 'mf') {
    return {
      components: {},
      details: {
        id: pilet.custom?.id,
        url: pilet.link,
      },
      kind: 'module',
      name: pilet.name,
      source: pilet.link,
    };
  } else if (pilet.spec === 'nf') {
    return {
      components: {},
      details: {
        url: pilet.link,
        exposes: pilet.custom.exposes,
      },
      kind: 'native',
      name: pilet.name,
      source: pilet.link,
    };
  } else {
    return {
      components: {},
      details: {
        ...pilet,
        url: pilet.link,
      },
      kind: 'pilet',
      name: pilet.name,
      source: pilet.link,
    };
  }
}
