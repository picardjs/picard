import { createRouter } from './router';
import { createListener } from './events';
import { createDecorator } from './decorator';
import { createFeed } from '@/common/feed';
import { createPicardScope } from '@/common/state';
import { createLoader } from '@/common/loader';
import { createInjector } from '@/common/injector';
import { createRenderer } from '@/common/renderer';
import { createSheet } from '@/common/styles';
import { createModuleFederation } from '@/common/kinds/module';
import { createNativeFederation } from '@/common/kinds/native';
import { createPilet } from '@/common/kinds/pilet';
import type { DecoratorService, FeedDefinition, FeedService } from '@/types';

export interface PicardOptions {
  componentName?: string;
  fragmentUrl?: string;
  slotName?: string;
  partName?: string;
  feed?: FeedDefinition;
  state?: any;
  services?: Record<string, any>;
  dependencies?: Record<string, () => Promise<any>>;
}

const defaultOptions = {
  componentName: 'pi-component',
  slotName: 'pi-slot',
  partName: 'pi-part',
  fragmentUrl: '',
  services: {},
  dependencies: {},
};

declare module '@/types/injector' {
  interface Services {
    decorator: DecoratorService;
    feed: FeedService;
  }

  interface Configuration {
    feed?: FeedDefinition;
    state?: any;
    fragmentUrl?: string;
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
      dependencies,
      services,
    }),
    events: createListener,
    scope: createPicardScope,
    feed: createFeed,
    renderer: createRenderer,
    router: createRouter,
    loader: createLoader,
    decorator: createDecorator,
    sheet: createSheet,
    'kind.module': createModuleFederation,
    'kind.native': createNativeFederation,
    'kind.pilet': createPilet,
  };

  return createInjector(serviceDefinitions).instantiate('loader').instantiate('feed').get('decorator');
}
