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

const runPicard = () => {
  const feed = script?.getAttribute('feed') || undefined;
  const state = deserializeState();
  initializePicard({
    feed,
    state,
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runPicard);
} else {
  runPicard();
}
