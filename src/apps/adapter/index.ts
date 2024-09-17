import { createFragments } from './fragments';
import { createRouter } from '@/common/browser/router';
import { createElements } from '@/common/browser/elements';
import { createListener } from '@/common/browser/events';
import { createPlatform } from '@/common/browser/platform';
import { createDebug } from '@/common/browser/debug';
import { createEsm } from '@/common/browser/esm';
import { createPicardScope } from '@/common/state';
import { createLoader } from '@/common/loader';
import { createInjector } from '@/common/injector';
import { createRenderer } from '@/common/ui/renderer';
import { createPilet } from '@/common/formats/pilet';
import { createModuleFederation } from '@/common/formats/module';
import { createNativeFederation } from '@/common/formats/native';
import { createDefaultConverter } from '@/common/frameworks/default';
import { createSingleSpaConverter } from '@/common/frameworks/single-spa';
import { createWebComponentConverter } from '@/common/frameworks/web-component';
import type { PicardStore, FragmentsService, ElementsService, DebugService } from '@/types';

function deserializeConfig(): any {
  // we obtain the serialized config
  const element = document.querySelector('script[type=pi-config]');

  if (element) {
    return JSON.parse(element.textContent || '{}');
  }

  return {};
}

export interface PicardOptions {
  /**
   * The config override if it should not be obtained
   * from the script[type=pi-config] element.
   */
  config?: any;
  /**
   * The additional services to register.
   */
  services?: Record<string, any>;
  /**
   * The centrally shared dependencies to use.
   */
  dependencies?: Record<string, () => Promise<any>>;
}

declare module '@/types/injector' {
  interface Services {
    elements: ElementsService;
    fragments: FragmentsService;
    debug: DebugService;
  }

  interface Configuration {
    state?: any;
    fragmentUrl: string;
    dependencies: Record<string, () => Promise<any>>;
  }
}

export function resumePicard(options?: PicardOptions): PicardStore {
  const { config, services = {}, ...configOverrides } = options || {};
  const defaultConfig = config || deserializeConfig();
  const serviceDefinitions = {
    ...services,
    config: () => ({
      ...defaultConfig,
      ...configOverrides,
    }),
    events: createListener,
    scope: createPicardScope,
    fragments: createFragments,
    loader: createLoader,
    esm: createEsm,
    renderer: createRenderer,
    platform: createPlatform,
    elements: createElements,
    router: createRouter,
    debug: createDebug,
    'format.module': createModuleFederation,
    'format.native': createNativeFederation,
    'format.pilet': createPilet,
    'framework.single-spa': createSingleSpaConverter,
    'framework.default': createDefaultConverter,
    'framework.web-component': createWebComponentConverter,
  };

  return createInjector(serviceDefinitions)
    .instantiate('loader')
    .instantiate('elements')
    .instantiate('router')
    .instantiate('debug')
    .get('scope');
}
