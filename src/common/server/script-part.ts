import type { DependencyInjector, PartService } from '@/types';

export function createScriptPart(injector: DependencyInjector): PartService {
  const scope = injector.get('scope');

  return {
    async getReplacement() {
      const state = `<script type="pi-state">${JSON.stringify(scope.readState())}</script>`;
      const hydrate = ''; //`<script src="/picard-ia.js"></script>`; TODO identify path reliably
      return `${state}${hydrate}`;
    },
  };
}
