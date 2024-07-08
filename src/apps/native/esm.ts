import type { DependencyInjector, EsmService } from '@/types';

export function createEsm(injector: DependencyInjector): EsmService {
  return {
    async load(url, depMap) {
      // TODO nothing yet
      return undefined;
    },
  };
}
