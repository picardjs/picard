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
import { createRenderer } from './renderer';
import type { PicardStore, FragmentsService, ElementsService, DebugService } from '@/types';

function deserializeConfig(): any {
  // we obtain the serialized config
  const element = document.querySelector('script[type=pi-config]');

  if (element) {
    return JSON.parse(element.textContent || '{}');
  }

  return {};
}

declare global {
  interface Window {
    /**
     * Gets access to the Picard.js API.
     */
    picard: PicardStore;
  }
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

const resumePicard = (): void => {
  const config = deserializeConfig();
  const serviceDefinitions = {
    config: () => config,
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
  };

  window.picard = createInjector(serviceDefinitions)
    .instantiate('loader')
    .instantiate('elements')
    .instantiate('router')
    .instantiate('debug')
    .get('scope');
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', resumePicard);
} else {
  resumePicard();
}
