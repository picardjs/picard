import type { EsmService } from '@/types';

export function createEsm(): EsmService {
  return {
    async load(url, depMap, parent) {
      const shimport = await import('./shimport');
      return await shimport.load(url, depMap, parent);
    },
  };
}
