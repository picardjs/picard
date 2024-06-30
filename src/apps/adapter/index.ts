import { createFragments } from './fragments';
import { createRouter } from '@/common/browser/router';
import { createElements } from '@/common/browser/elements';
import { createListener } from '@/common/browser/events';
import { createDebug } from '@/common/browser/debug';
import { createPicardScope } from '@/common/state';
import { createLoader } from '@/common/loader';
import { createInjector } from '@/common/injector';
import { createRenderer } from './renderer';
import type { PicardStore, FragmentsService, ElementsService, DebugService } from '@/types';

function deserializeConfig() {
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
}

const resumePicard = () => {
  const config = deserializeConfig();
  const serviceDefinitions = {
    config: () => config,
    events: createListener,
    scope: createPicardScope,
    fragments: createFragments,
    loader: createLoader,
    renderer: createRenderer,
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
