import { deserializeConfig, resumePicard } from '../adapter';
import type { PicardStore } from '@/types';

declare global {
  interface Window {
    /**
     * Gets access to the Picard.js API.
     */
    picard: PicardStore;
  }
}

function importModule(url: string) {
  // URLs from the server are relative to the document, not to this script
  return import(/* @vite-ignore */ /* webpackIgnore:true */ new URL(url, document.baseURI).href);
}

async function loadServices(services: Record<string, string> = {}) {
  const entries = await Promise.all(
    Object.entries(services).map(async ([name, url]) => {
      const { default: creator } = await importModule(url);
      return [name, creator] as const;
    }),
  );

  return Object.fromEntries(entries);
}

function getDependencies(dependencies: Record<string, string> = {}) {
  return Object.fromEntries(Object.entries(dependencies).map(([name, url]) => [name, () => importModule(url)]));
}

const runPicard = async () => {
  const config = deserializeConfig();
  const { services, dependencies } = config.client || {};

  window.picard = resumePicard({
    config,
    services: await loadServices(services),
    dependencies: getDependencies(dependencies),
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runPicard);
} else {
  runPicard();
}
