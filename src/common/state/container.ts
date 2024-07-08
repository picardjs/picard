import type { ComponentGetter, DependencyInjector, PicardMicrofrontend } from '@/types';

export async function loadContainer(
  injector: DependencyInjector,
  mf: PicardMicrofrontend,
  containers: Record<string, Promise<ComponentGetter>>,
) {
  const { name, format, details } = mf;
  let container = containers[name];

  if (!container) {
    const service = injector.get(`format.${format}`);
    container = service.createContainer(details).then(
      async (c) => {
        const assets = c.getAssets();
        const names = c.getNames();
        const scope = injector.get('scope');

        for (const asset of assets) {
          scope.registerAsset(mf, asset.url, asset.type);
        }

        for (const name of names) {
          const comp = await c.load(name);
          scope.registerComponent(mf, name, comp);
        }

        return c;
      },
      (ex) => {
        console.warn('Failed to load micro frontend %s:', name, ex);

        return {
          getAssets() {
            return [];
          },
          getNames() {
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
