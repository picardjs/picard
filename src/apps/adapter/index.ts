import { initializePicard } from '../client';
import type { PicardStore } from '@/types';

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

const resumePicard = () => {
  const state = deserializeState();
  const scope = initializePicard({
    state,
  });
  window.picard = scope;
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', resumePicard);
} else {
  resumePicard();
}
