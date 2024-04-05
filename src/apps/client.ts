import { createPicardScope } from '../state';
import { createLoader } from '../loader';
import { createCustomElements } from '../client/components';
import { createListener } from '../client/events';
import { createRenderer } from '../client/render';
import { createRouter } from '../client/router';
import { DiscoveryResponse, PiletEntry } from '../types';

export interface PicardOptions {
  componentName?: string;
  slotName?: string;
  feed?: string | (() => Promise<Array<PiletEntry> | DiscoveryResponse>);
  state?: any;
}

export function initializePicard(options?: PicardOptions) {
  const { feed, state, componentName, slotName } = options || {};
  const scope = createPicardScope(state);
  const events = createListener();
  const render = createRenderer(scope);
  createLoader();
  createCustomElements({
    render,
    componentName,
    slotName,
  });
  createRouter();
}
