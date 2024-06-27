import type { ComponentGetter, DependencyInjector, PicardMicrofrontend } from '@/types';

export async function loadContainer(
  injector: DependencyInjector,
  mf: PicardMicrofrontend,
  containers: Record<string, Promise<ComponentGetter>>,
) {
  let container = containers[mf.name];

  if (!container) {
    const service = injector.get(`kind.${mf.kind}`);
    container = service.createContainer(mf.details);
    containers[mf.name] = container.then((c) => {
      const assets = c.getAssets();

      if (assets.length > 0) {
        const scope = injector.get('scope');

        assets.forEach((asset) => {
          scope.registerAsset(mf, asset.url, asset.type);
        });
      }

      return c;
    });
  }

  return await container;
}
