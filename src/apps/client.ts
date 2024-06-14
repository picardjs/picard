import { createPicardScope } from '../state';
import { createLoader } from '../loader';
import { createFeed } from '../client/feed';
import { createElements } from '../client/elements';
import { createFragments } from '../client/fragments';
import { createListener } from '../client/events';
import { createRenderer } from '../client/render';
import { createRouter } from '../client/router';
import { createDebug } from '../client/debug';
import { createInjector } from '../injector';
import type { FeedDefinition, FragmentsService, LoadingQueue, RendererService } from '../types';

export interface PicardOptions {
  componentName?: string;
  fragmentUrl?: string;
  slotName?: string;
  feed?: FeedDefinition;
  state?: any;
  meta?: any;
  stylesheet?: boolean;
}

const defaultOptions = {
  componentName: 'pi-component',
  slotName: 'pi-slot',
  fragmentUrl: '',
  stylesheet: true,
};

interface LoaderService {}

interface ElementsService {}

interface RouterService {
  navigate(route: string, state: any): void;
  findRoutes(): Array<string>;
  dispose(): void;
}

interface DebugService {
  dispose(): void;
}

declare module '../types/injector' {
  interface Services {
    loader: LoaderService;
    elements: ElementsService;
    router: RouterService;
    renderer: RendererService;
    fragments: FragmentsService;
    feed: LoadingQueue;
    debug: DebugService;
  }

  interface Configuration {
    feed?: FeedDefinition;
    state?: any;
    meta?: any;
    fragmentUrl?: string;
    stylesheet: boolean;
    slotName: string;
    componentName: string;
  }
}

export function initializePicard(options?: PicardOptions) {
  const {
    feed,
    state,
    meta,
    fragmentUrl = defaultOptions.fragmentUrl,
    componentName = defaultOptions.componentName,
    slotName = defaultOptions.slotName,
    stylesheet = defaultOptions.stylesheet,
  } = options || {};

  const serviceDefinitions = {
    config: () => ({
      feed,
      state,
      meta,
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
    elements: createElements,
    router: createRouter,
    debug: createDebug,
  };

  return createInjector(serviceDefinitions)
    .instantiate('loader')
    .instantiate('elements')
    .instantiate('router')
    .instantiate('debug')
    .get('scope');
}
