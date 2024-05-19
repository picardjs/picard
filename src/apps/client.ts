import { createPicardScope } from '../state';
import { createLoader } from '../loader';
import { createFeed } from '../client/feed';
import { createElements } from '../client/elements';
import { createFragments } from '../client/fragments';
import { createListener } from '../client/events';
import { createRenderer } from '../client/render';
import { createRouter } from '../client/router';
import type { FeedDefinition } from '../types';

export interface PicardOptions {
  componentName?: string;
  fragmentUrl?: string;
  slotName?: string;
  feed?: FeedDefinition;
  state?: any;
}

export function initializePicard(options?: PicardOptions) {
  const { feed, state, componentName, slotName, fragmentUrl } = options || {};
  const events = createListener();
  const scope = createPicardScope(state, events);
  const queue = createFeed(feed, scope);
  const { render, collect } = createRenderer(queue, scope);
  const loadFragment = createFragments({
    componentName,
    fragmentUrl,
    collect,
  });
  createLoader();
  createElements({
    render,
    componentName,
    loadFragment,
    slotName,
    events,
  });
  createRouter();
  return scope;
}
