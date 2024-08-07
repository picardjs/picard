import { getUrl } from '@/common/utils/url';
import { initializePicard, PicardOptions } from '../client';
import type { PicardStore } from '@/types';

const script = document.currentScript as PicardStartScriptElement;

interface PicardStartScriptElement extends HTMLScriptElement {
  config?: PicardOptions;
}

function deserializeState(): any {
  // we obtain the serialized state
  const element = document.querySelector('script[type=pi-state]');

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

const runPicard = (): void => {
  const feed = script?.getAttribute('feed') || undefined;
  const options = script?.config;
  const state = deserializeState();
  const scope = initializePicard({
    ...options,
    feed,
    state,
    baseUrl: getUrl('.', script.src),
  });
  window.picard = scope;
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runPicard);
} else {
  runPicard();
}
