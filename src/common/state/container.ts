import type { ComponentGetter, DependencyInjector, PicardMicrofrontend } from '@/types';

const containers: Record<string, Promise<ComponentGetter>> = {};

export async function loadContainer(injector: DependencyInjector, mf: PicardMicrofrontend) {
  let container = containers[mf.name];

  if (!container) {
    const service = injector.get(`kind.${mf.kind}`);
    container = service.createContainer(mf.details);
    containers[mf.name] = container;
  }

  return await container;
}
