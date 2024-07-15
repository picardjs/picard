import { createFragments } from './fragments';
import { createFeed } from '@/common/feed';
import { createPicardScope } from '@/common/state';
import { createLoader } from '@/common/loader';
import { createInjector } from '@/common/injector';
import { createEsm } from '@/common/browser/esm';
import { createRouter } from '@/common/browser/router';
import { createElements } from '@/common/browser/elements';
import { createListener } from '@/common/browser/events';
import { createPlatform } from '@/common/browser/platform';
import { createDebug } from '@/common/browser/debug';
import { createSheet } from '@/common/ui/styles';
import { createRenderer } from '@/common/ui/renderer';
import { createPilet } from '@/common/formats/pilet';
import { createModuleFederation } from '@/common/formats/module';
import { createNativeFederation } from '@/common/formats/native';
import { createDefaultConverter } from '@/common/frameworks/default';
import { createHtmlConverter } from '@/common/frameworks/html';
import { createSingleSpaConverter } from '@/common/frameworks/single-spa';
import { createWebComponentConverter } from '@/common/frameworks/web-component';
import { createSlotBehaviorForRouter } from '@/common/slot-rels/router';
import type { DebugService, ElementsService, FeedDefinition, FeedService, FragmentsService, PicardStore } from '@/types';

export interface PicardOptions {
  /**
   * The name of the pi-component.
   * @default pi-component
   */
  componentName?: string;
  /**
   * The name of the pi-slot.
   * @default pi-slot
   */
  slotName?: string;
  /**
   * The name of the pi-part.
   * @default pi-part
   */
  partName?: string;
  /**
   * The micro frontend discovery service URL,
   * data from calling it, or callback function
   * to call it manually.
   */
  feed?: FeedDefinition;
  /**
   * The initial state of Picard.js - if resumed.
   */
  state?: any;
  /**
   * The application's meta data.
   */
  meta?: any;
  /**
   * The additional services to register.
   */
  services?: Record<string, any>;
  /**
   * The centrally shared dependencies to use.
   */
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

export function initializePicard(options?: PicardOptions): PicardStore {
  const {
    feed,
    state,
    meta,
    services = defaultOptions.services,
    dependencies = defaultOptions.dependencies,
    componentName = defaultOptions.componentName,
    partName = defaultOptions.partName,
    slotName = defaultOptions.slotName,
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
    esm: createEsm,
    'format.module': createModuleFederation,
    'format.native': createNativeFederation,
    'format.pilet': createPilet,
    'framework.single-spa': createSingleSpaConverter,
    'framework.default': createDefaultConverter,
    'framework.html': createHtmlConverter,
    'framework.web-component': createWebComponentConverter,
    'slotRel.router': createSlotBehaviorForRouter,
  };

  return createInjector(serviceDefinitions)
    .instantiate('loader')
    .instantiate('feed')
    .instantiate('elements')
    .instantiate('router')
    .instantiate('debug')
    .get('scope');
}
