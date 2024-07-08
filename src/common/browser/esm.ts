import type { DependencyInjector, PlatformService, EsmService } from '@/types';

async function getShimport(platform: PlatformService) {
  const marker = '__shimport__';

  if (marker in globalThis) {
    return globalThis[marker];
  }

  await platform.loadScript('./dist/picard-esm.js');
  return globalThis[marker];
}

export function createEsm(injector: DependencyInjector): EsmService {
  const platform = injector.get('platform');

  return {
    async load(url, depMap) {
      const shimport = await getShimport(platform);
      return await shimport.load(url, depMap);
    },
  };
}
