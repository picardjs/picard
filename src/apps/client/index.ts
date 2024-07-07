import { createFragments } from './fragments';
import { createFeed } from '@/common/feed';
import { createRenderer } from '@/common/renderer';
import { createPicardScope } from '@/common/state';
import { createLoader } from '@/common/loader';
import { createInjector } from '@/common/injector';
import { createRouter } from '@/common/browser/router';
import { createElements } from '@/common/browser/elements';
import { createListener } from '@/common/browser/events';
import { createPlatform } from '@/common/browser/platform';
import { createDebug } from '@/common/browser/debug';
import { createSheet } from '@/common/styles';
import { createPilet } from '@/common/kinds/pilet';
import { createModuleFederation } from '@/common/kinds/module';
import { createNativeFederation } from '@/common/kinds/native';
import { createDefaultConverter } from '@/common/frameworks/default';
import { createHtmlConverter } from '@/common/frameworks/html';
import { createSingleSpaConverter } from '@/common/frameworks/single-spa';
import { createWebComponentConverter } from '@/common/frameworks/web-component';
import type { DebugService, ElementsService, FeedDefinition, FeedService, FragmentsService } from '@/types';

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
  stylesheet: true,
  services: {},
  dependencies: {},
};

declare module '@/types/injector' {
  interface Services {
    elements: ElementsService;
    fragments: FragmentsService;
    feed: FeedService;
    debug: DebugService;
  }

  interface Configuration {
    feed?: FeedDefinition;
    state?: any;
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
      stylesheet,
      dependencies,
    }),
    events: createListener,
    scope: createPicardScope,
    feed: createFeed,
    renderer: createRenderer,
    fragments: createFragments,
    platform: createPlatform,
    sheet: createSheet,
    loader: createLoader,
    elements: createElements,
    router: createRouter,
    debug: createDebug,
    'kind.module': createModuleFederation,
    'kind.native': createNativeFederation,
    'kind.pilet': createPilet,
    'framework.single-spa': createSingleSpaConverter,
    'framework.default': createDefaultConverter,
    'framework.html': createHtmlConverter,
    'framework.web-component': createWebComponentConverter,
  };

  return createInjector(serviceDefinitions)
    .instantiate('loader')
    .instantiate('feed')
    .instantiate('elements')
    .instantiate('router')
    .instantiate('debug')
    .get('scope');
}
