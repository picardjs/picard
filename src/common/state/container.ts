import { withModuleFederation } from '../kinds/mf';
import { withNativeFederation } from '../kinds/nf';
import { withPilet } from '../kinds/pi';
import type { ComponentGetter, DependencyInjector, PicardMicrofrontend } from '@/types';

const containers: Record<string, Promise<ComponentGetter>> = {};

async function createContainer(injector: DependencyInjector, mf: PicardMicrofrontend) {
  switch (mf.kind) {
    case 'mf': {
      return await withModuleFederation(injector, mf.details);
    }
    case 'nf': {
      return await withNativeFederation(injector, mf.details);
    }
    default: {
      return await withPilet(injector, mf.details);
    }
  }
}

export async function loadContainer(injector: DependencyInjector, mf: PicardMicrofrontend) {
  let container = containers[mf.name];

  if (!container) {
    container = createContainer(injector, mf);
    containers[mf.name] = container;
  }

  return await container;
}
