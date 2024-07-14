import type { DependencyInjector, PlatformService, EsmService } from '@/types';

let load: Promise<void> = undefined;

async function getShimport(platform: PlatformService) {
  const marker = '__shimport__';

  if (!load) {
    load = platform.loadScript('./dist/picard-esm.js');
  }

  await load;
  return globalThis[marker];
}

export function createEsm(injector: DependencyInjector): EsmService {
  const platform = injector.get('platform');

  return {
    async load(url, depMap, parent) {
      const shimport = await getShimport(platform);
      return await shimport.load(url, depMap, parent);
    },
  };
}
