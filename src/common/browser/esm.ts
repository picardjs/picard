import type { EsmService } from '@/types';

export function createEsm(): EsmService {
  return {
    async load(url, depMap, parent) {
      const shimport = await import('./shimport');

      try {
        return await shimport.load(url, depMap, parent);
      } catch (error) {
        if (Object.keys(depMap).length > 0) {
          throw error;
        }

        // e.g., a strict Content Security Policy (such as in browser extensions) forbids the blob: scripts
        // of shimport - without shared dependencies nothing needs to be rewritten, so the module is imported
        return await import(/* @vite-ignore */ /* webpackIgnore: true */ url);
      }
    },
  };
}
