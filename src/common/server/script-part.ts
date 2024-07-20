import type { DependencyInjector, PartService } from '@/types';

export function createScriptPart(injector: DependencyInjector): PartService {
  const scope = injector.get('scope');
  const { componentName, slotName, fragmentUrl, meta, scriptUrl } = injector.get('config');

  return {
    async getReplacement() {
      const state = scope.readState();
      const config = `<script type="pi-config">${JSON.stringify({
        componentName,
        slotName,
        fragmentUrl,
        meta,
        state,
      })}</script>`;
      const script = `<script src="${scriptUrl}"></script>`;
      return `${config}${script}`;
    },
  };
}
