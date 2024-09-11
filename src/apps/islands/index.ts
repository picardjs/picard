import { resumePicard } from '../adapter';
import type { PicardStore } from '@/types';

declare global {
  interface Window {
    /**
     * Gets access to the Picard.js API.
     */
    picard: PicardStore;
  }
}

const runPicard = (): void => {
  const scope = resumePicard();
  window.picard = scope;
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runPicard);
} else {
  runPicard();
}
