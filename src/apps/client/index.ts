import { createFragments } from './fragments';
import { createFeed } from '@/common/feed';
import { createRenderer } from '@/common/renderer';
import { createPicardScope } from '@/common/state';
import { createLoader } from '@/common/loader';
import { createInjector } from '@/common/injector';
import { createRouter } from '@/common/browser/router';
import { createElements } from '@/common/browser/elements';
import { createListener } from '@/common/browser/events';
import { createDebug } from '@/common/browser/debug';
import { createModuleFederation } from '@/common/kinds/module';
import { createNativeFederation } from '@/common/kinds/native';
import { createPilet } from '@/common/kinds/pilet';
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

function createSingleSpa() {
  return {
    convert(component) {
      return {
        bootstrap() {
          return component.bootstrap();
        },
        mount(container, props, locals) {
          locals.container = container;
          component.mount({
            ...props,
            domElement: container,
          });
        },
        unmount(container) {
          component.unmount({
            domElement: container,
          });
        },
        update(props, locals) {
          component.update?.({ ...props, domElement: locals.container });
        },
        unload() {
          return Promise.resolve();
        },
        stringify() {
          return Promise.resolve('');
        },
      };
    },
  };
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
    'kind.module': createModuleFederation,
    'kind.native': createNativeFederation,
    'kind.pilet': createPilet,
    'framework.single-spa': createSingleSpa,
  };

  return createInjector(serviceDefinitions)
    .instantiate('loader')
    .instantiate('feed')
    .instantiate('elements')
    .instantiate('router')
    .instantiate('debug')
    .get('scope');
}
