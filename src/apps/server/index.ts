import { createFeed } from './feed';
import { createListener } from './events';
import { createRenderer } from './renderer';
import { createFragments } from './fragments';
import { DecoratorService, createDecorator } from './decorator';
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

declare module '@/types/injector' {
  interface Services {
    decorator: DecoratorService;
  }

  interface Configuration {
    feed?: FeedDefinition;
    state?: any;
    meta?: any;
    fragmentUrl?: string;
    stylesheet: boolean;
    slotName: string;
    componentName: string;
    dependencies: Record<string, () => Promise<any>>;
  }
}

export function initializePicard(options?: PicardOptions) {
  const {
    feed,
    state,
    services = defaultOptions.services,
    dependencies = defaultOptions.dependencies,
    fragmentUrl = defaultOptions.fragmentUrl,
    componentName = defaultOptions.componentName,
    slotName = defaultOptions.slotName,
    partName = defaultOptions.partName,
    stylesheet = defaultOptions.stylesheet,
  } = options || {};

  const serviceDefinitions = {
    ...services,
    config: () => ({
      feed,
      state,
      componentName,
      partName,
      slotName,
      fragmentUrl,
      stylesheet,
      dependencies,
      services,
    }),
    events: createListener,
    scope: createPicardScope,
    feed: createFeed,
    renderer: createRenderer,
    fragments: createFragments,
    loader: createLoader,
    decorator: createDecorator,
  };

  return createInjector(serviceDefinitions).instantiate('loader').get('decorator');
}
