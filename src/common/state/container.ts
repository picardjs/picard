import type { ComponentGetter, DependencyInjector, PicardMicrofrontend } from '@/types';

export async function loadContainer(
  injector: DependencyInjector,
  mf: PicardMicrofrontend,
  containers: Record<string, Promise<ComponentGetter>>,
) {
  const { name, kind, details } = mf;
  let container = containers[name];

  if (!container) {
    const service = injector.get(`kind.${kind}`);
    container = service.createContainer(details).then(
      (c) => {
        const assets = c.getAssets();

        if (assets.length > 0) {
          const scope = injector.get('scope');

          assets.forEach((asset) => {
            scope.registerAsset(mf, asset.url, asset.type);
          });
        }

        return c;
      },
      (ex) => {
        console.warn('Failed to load micro frontend %s:', name, ex);

        return {
          getAssets() {
            return [];
          },
          load() {
            return undefined;
          },
        };
      },
    );
    containers[name] = container;
  }

  return await container;
}
