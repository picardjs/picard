import { PicardStore } from '../types';
import { initializePicard } from './client';

const script = document.currentScript;

function deserializeState() {
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

const runPicard = () => {
  const feed = script?.getAttribute('feed') || undefined;
  const state = deserializeState();
  const scope = initializePicard({
    feed,
    state,
  });
  window.picard = scope;
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runPicard);
} else {
  runPicard();
}
