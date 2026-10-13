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
      // wait for the pending micro frontends (e.g., from the feed), as the
      // part may be rendered before any component (e.g., in a separate call)
      await scope.loadAssets('css');
      const state = scope.readState();
      const config = `<script type="pi-config">${serialize({
        componentName,
        slotName,
        fragmentUrl,
        meta,
        state,
        client,
      })}</script>`;
      // start loading only after the first paint to keep the client off the critical rendering path
      const script = `<script type="module">requestAnimationFrame(()=>setTimeout(()=>import(${serialize(scriptUrl)})))</script>`;
      return `${config}${script}`;
    },
  };
}
