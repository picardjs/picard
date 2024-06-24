import { createFeed } from './feed';
import { createElements } from './elements';
import { createFragments } from './fragments';
import { createListener } from './events';
import { createRenderer } from './renderer';
import { createRouter } from './router';
import { createDebug } from './debug';
import { createPicardScope } from '@/common/state';
import { createLoader } from '@/common/loader';
import { createInjector } from '@/common/injector';
import type { FeedDefinition } from '@/types';

export interface PicardOptions {
  componentName?: string;
  fragmentUrl?: string;
  slotName?: string;
  partName?: string;
  feed?: FeedDefinition;
  state?: any;
  meta?: any;
  stylesheet?: boolean;
  services?: Record<string, any>;
  dependencies?: Record<string, () => Promise<any>>;
}

const defaultOptions = {
  componentName: 'pi-component',
  slotName: 'pi-slot',
  partName: 'pi-part',
  fragmentUrl: '',
  stylesheet: true,
  services: {},
  dependencies: {},
};

interface ElementsService {}

interface DebugService {
  dispose(): void;
}

declare module '@/types/injector' {
  interface Services {
    elements: ElementsService;
    debug: DebugService;
  }

  interface Configuration {
    feed?: FeedDefinition;
    state?: any;
    meta?: any;
    fragmentUrl?: string;
    partName: string;
    stylesheet: boolean;
    slotName: string;
    componentName: string;
    dependencies: Record<string, () => Promise<any>>;
  }
}

export function share(exports: any) {
  return () => Promise.resolve(exports);
}

export function initializePicard(options?: PicardOptions) {
  const {
    feed,
    state,
    meta,
    services = defaultOptions.services,
    dependencies = defaultOptions.dependencies,
    fragmentUrl = defaultOptions.fragmentUrl,
    componentName = defaultOptions.componentName,
    partName = defaultOptions.partName,
    slotName = defaultOptions.slotName,
    stylesheet = defaultOptions.stylesheet,
  } = options || {};

  const serviceDefinitions = {
    ...services,
    config: () => ({
      feed,
      state,
      meta,
      componentName,
      partName,
      slotName,
      fragmentUrl,
      stylesheet,
      dependencies,
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
