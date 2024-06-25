import { loadJson } from '@/common/kinds/utils';
import type {
  DiscoveryResponse,
  FeedDefinition,
  PicardMicrofrontend,
  PiletDefinition,
  StaticFeed,
  DependencyInjector,
  FeedService,
} from '@/types';

function fromPilet(pilet: PiletDefinition): PicardMicrofrontend {
  if (pilet.spec === 'mf') {
    return {
      components: {},
      details: {
        id: pilet.custom?.id,
        url: pilet.link,
      },
      kind: 'mf',
      name: pilet.name,
      source: `mf:${pilet.link}`,
    };
  } else if (pilet.spec === 'nf') {
    return {
      components: {},
      details: {
        url: pilet.link,
        exposes: pilet.custom.exposes,
      },
      kind: 'nf',
      name: pilet.name,
      source: `nf:${pilet.link}`,
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

function fromDiscovery(feed: DiscoveryResponse): Array<PicardMicrofrontend> {
  const mfs = feed.microFrontends || {};

  return Object.entries(mfs)
    .filter(([, definitions]) => Array.isArray(definitions) && definitions.length > 0)
    .map(([name, definitions]) => {
      const [definition] = definitions;
      const kind = definition.extras?.pilet.spec;

      if (kind === undefined || kind === 'mf') {
        return {
          components: {},
          details: {
            id: definition.extras?.id || name,
            url: definition.url,
          },
          kind: 'mf',
          name,
          source: `mf:${definition.url}`,
        };
      } else if (kind === 'nf') {
        return {
          components: {},
          details: {
            url: definition.url,
            exposes: definition.extras?.exposes,
          },
          kind: 'nf',
          name,
          source: `nf:${definition.url}`,
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

async function loadFeed(feed: FeedDefinition | undefined): Promise<Array<PicardMicrofrontend>> {
  if (typeof feed === 'string') {
    const doc = await loadJson<StaticFeed>(feed);
    return await loadFeed(doc);
  } else if (typeof feed === 'function') {
    const doc = await feed();
    return await loadFeed(doc);
  } else if (Array.isArray(feed)) {
    return feed.map(fromPilet);
  } else if (!feed || typeof feed !== 'object') {
    // We maybe should emit an error here.
  } else if ('items' in feed && Array.isArray(feed.items)) {
    return feed.items.map(fromPilet);
  } else if ('microFrontends' in feed) {
    return fromDiscovery(feed);
  }

  return [];
}

export function createFeed(injector: DependencyInjector): FeedService {
  const { feed } = injector.get('config');
  const scope = injector.get('scope');
  scope.loadMicrofrontends(loadFeed(feed));
  return {};
}
