import { createEsm } from './esm';
import { createListener } from './events';
import { createPlatform } from './platform';
import { createFeed } from '@/common/feed';
import { createPicardScope } from '@/common/state';
import { createLoader } from '@/common/loader';
import { createInjector } from '@/common/injector';
import { createSheet } from '@/common/ui/styles';
import { createRenderer } from '@/common/ui/renderer';
import { createRouter } from '@/common/server/router';
import { createModuleFederation } from '@/common/formats/module';
import { createNativeFederation } from '@/common/formats/native';
import { createPilet } from '@/common/formats/pilet';
import { createDefaultConverter } from '@/common/frameworks/default';
import { createHtmlConverter } from '@/common/frameworks/html';
import type { FeedDefinition, FeedService } from '@/types';

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
  services: {},
  dependencies: {},
};

declare module '@/types/injector' {
  interface Services {
    feed: FeedService;
  }

  interface Configuration {
    feed?: FeedDefinition;
    state?: any;
    dependencies: Record<string, () => Promise<any>>;
  }
}

export function initializePicard(options?: PicardOptions) {
  const {
    feed,
    state,
    services = defaultOptions.services,
    dependencies = defaultOptions.dependencies,
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
      dependencies,
      services,
    }),
    events: createListener,
    esm: createEsm,
    scope: createPicardScope,
    feed: createFeed,
    renderer: createRenderer,
    router: createRouter,
    platform: createPlatform,
    loader: createLoader,
    sheet: createSheet,
    'format.module': createModuleFederation,
    'format.native': createNativeFederation,
    'format.pilet': createPilet,
    'framework.default': createDefaultConverter,
    'framework.html': createHtmlConverter,
  };

  return createInjector(serviceDefinitions).instantiate('loader').instantiate('feed').get('scope');
}
