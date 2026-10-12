import type { DependencyInjector, PartService } from '@/types';

function serialize(value: any) {
  // prevent closing the script element or starting a comment from the data
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function createScriptPart(injector: DependencyInjector): PartService {
  const scope = injector.get('scope');
  const { componentName, slotName, fragmentUrl, meta, scriptUrl, client } = injector.get('config');

  return {
    async getReplacement() {
      const state = scope.readState();
      const config = `<script type="pi-config">${serialize({
        componentName,
        slotName,
        fragmentUrl,
        meta,
        state,
        client,
      })}</script>`;
      const script = `<script type="module" src=${JSON.stringify(scriptUrl)}></script>`;
      return `${config}${script}`;
    },
  };
}
