import { createPicardScope } from '../state';
import { createLoader } from '../loader';
import { createFeed } from '../server/feed';
import { createListener } from '../server/events';
import { createRouter } from '../server/router';
import { createInjector } from '../injector';
import type { FeedDefinition } from '../types';

export interface PicardOptions {
  componentName?: string;
  fragmentUrl?: string;
  slotName?: string;
  feed?: FeedDefinition;
  state?: any;
  stylesheet?: boolean;
}

const defaultOptions = {
  componentName: 'pi-component',
  slotName: 'pi-slot',
  fragmentUrl: '',
  stylesheet: true,
};

export function initializePicard(options?: PicardOptions) {
  const {
    feed,
    state,
    fragmentUrl = defaultOptions.fragmentUrl,
    componentName = defaultOptions.componentName,
    slotName = defaultOptions.slotName,
    stylesheet = defaultOptions.stylesheet,
  } = options || {};

  const serviceDefinitions = {
    config: () => ({
      feed,
      state,
      componentName,
      slotName,
      fragmentUrl,
      stylesheet,
    }),
    events: createListener,
    scope: createPicardScope,
    feed: createFeed,
    renderer: createRenderer,
    fragments: createFragments,
    loader: createLoader,
    router: createRouter,
  };

  return createInjector(serviceDefinitions).instantiate('loader').instantiate('router').get('scope');
}
