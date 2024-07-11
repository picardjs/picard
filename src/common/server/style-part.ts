import type { DependencyInjector, PartService } from '@/types';

export function createStylePart(injector: DependencyInjector): PartService {
  const scope = injector.get('scope');
  const sheet = injector.get('sheet');

  return {
    async getReplacement() {
      const assets = await scope.loadAssets('css');
      const internals = `<style>${sheet?.content}</style>`;
      const externals = assets
        .map((id) => scope.retrieveAsset(id))
        .filter(Boolean)
        .map(
          (asset) =>
            `<link rel="stylesheet" href=${JSON.stringify(asset.url)} data-origin=${JSON.stringify(asset.origin)} data-ref-id=${JSON.stringify(asset.id)}>`,
        )
        .join('');

      return `${internals}${externals}`;
    },
  };
}
