import { loadJson } from '@/common/kinds/utils';
import type { FeedDefinition, PicardMicrofrontend, StaticFeed, DependencyInjector, FeedService } from '@/types';
import { fromPiral } from './piral';
import { fromDiscovery } from './discovery';

async function loadFeed(feed: FeedDefinition | undefined): Promise<Array<PicardMicrofrontend>> {
  if (typeof feed === 'string') {
    const doc = await loadJson<StaticFeed>(feed);
    return await loadFeed(doc);
  } else if (typeof feed === 'function') {
    const doc = await feed();
    return await loadFeed(doc);
  } else if (Array.isArray(feed)) {
    return feed.map(fromPiral);
  } else if (!feed || typeof feed !== 'object') {
    // We maybe should emit an error here.
  } else if ('items' in feed && Array.isArray(feed.items)) {
    return feed.items.map(fromPiral);
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
