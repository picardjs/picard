import { defer } from './utils';
import { loadJson } from '../kinds/utils';
import type {
  DiscoveryResponse,
  FeedDefinition,
  PicardMicrofrontend,
  PicardStore,
  PiletDefinition,
  StaticFeed,
  LoadingQueue,
} from '../types';

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
        name: pilet.name,
        url: pilet.link,
        link: pilet.link,
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

function storeMicrofrontends(microfrontends: Array<PicardMicrofrontend>, scope: PicardStore) {
  scope.setState((state) => {
    defer(() => {
      state.context.events.emit('updated-microfrontends', {
        added: microfrontends.map((m) => m.name),
        removed: [],
      });
    });
    return {
      microfrontends: [...state.microfrontends, ...microfrontends],
    };
  });
}

async function loadFeed(feed: FeedDefinition | undefined, scope: PicardStore) {
  if (typeof feed === 'string') {
    const doc = await loadJson<StaticFeed>(feed);
    await loadFeed(doc, scope);
  } else if (typeof feed === 'function') {
    const doc = await feed();
    await loadFeed(doc, scope);
  } else if (Array.isArray(feed)) {
    storeMicrofrontends(feed.map(fromPilet), scope);
  } else if (!feed || typeof feed !== 'object') {
    // We maybe should emit an error here.
  } else if ('items' in feed && Array.isArray(feed.items)) {
    storeMicrofrontends(feed.items.map(fromPilet), scope);
  } else if ('microFrontends' in feed) {
    storeMicrofrontends(fromDiscovery(feed), scope);
  }
}

export function createFeed(feed: FeedDefinition | undefined, scope: PicardStore): LoadingQueue {
  const queue: LoadingQueue = {
    current: loadFeed(feed, scope),
    async enqueue(cb) {
      const next = queue.current.then(cb);
      queue.current = next.then(() => {});
      return await next;
    },
  };
  return queue;
}
