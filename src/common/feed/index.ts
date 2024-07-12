import { fromPiral } from './piral';
import { fromDiscovery } from './discovery';
import { fromManifest } from './manifest';
import { getUrl } from '@/common/utils/url';
import type {
  FeedDefinition,
  PicardMicrofrontend,
  StaticFeed,
  DependencyInjector,
  FeedService,
  DiscoveryResponse,
  PlatformService,
} from '@/types';

async function loadFeed(
  platform: PlatformService,
  feed: FeedDefinition | undefined,
  baseUrl?: string,
): Promise<Array<PicardMicrofrontend>> {
  if (typeof feed === 'string') {
    const url = getUrl(feed, baseUrl);
    const doc = await platform.loadJson<StaticFeed>(url);
    return await loadFeed(platform, doc, url);
  } else if (typeof feed === 'function') {
    const doc = await feed();
    return await loadFeed(platform, doc, baseUrl);
  } else if (Array.isArray(feed)) {
    return feed.map((pilet) => fromPiral(pilet, baseUrl));
  } else if (!feed) {
    // we just ignore a falsy value (must be 0, empty string, undefined, or null)
  } else if (!feed || typeof feed !== 'object') {
    console.warn(`Cannot handle a "feed" with the following shape:`, feed);
  } else if ('items' in feed && Array.isArray(feed.items)) {
    return feed.items.map((pilet) => fromPiral(pilet, baseUrl));
  } else if ('microFrontends' in feed) {
    return fromDiscovery(feed as DiscoveryResponse, baseUrl);
  } else {
    return fromManifest(feed as Record<string, string>, baseUrl);
  }

  return [];
}

export function createFeed(injector: DependencyInjector): FeedService {
  const { feed } = injector.get('config');
  const scope = injector.get('scope');
  const platform = injector.get('platform');
  scope.loadMicrofrontends(loadFeed(platform, feed));
  return {};
}
