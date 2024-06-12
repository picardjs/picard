import { createPicardScope } from '../state';
import { createLoader } from '../loader';
import { createFeed } from '../client/feed';
import { createElements } from '../client/elements';
import { createFragments } from '../client/fragments';
import { createListener } from '../client/events';
import { createRenderer } from '../client/render';
import { createRouter } from '../client/router';
import { createInjector } from '../injector';
import type {
  ComponentLifecycle,
  ComponentRef,
  FeedDefinition,
  FragmentsService,
  LoadingQueue,
  RendererService,
} from '../types';

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

interface LoaderService {}

interface ElementsService {}

interface RouterService {
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
  }

  interface Configuration {
    feed?: FeedDefinition;
    state?: any;
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
    elements: createElements,
    router: createRouter,
  };

  return createInjector(serviceDefinitions)
    .instantiate('loader')
    .instantiate('elements')
    .instantiate('router')
    .get('scope');
}
