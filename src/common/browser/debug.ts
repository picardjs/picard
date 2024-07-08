import type { DependencyInjector } from '@/types';

const debugScript = './picard-debug.mjs';

interface DebugAdapter {
  dispose(): void;
}

export function createDebug(injector: DependencyInjector) {
  let adapter: DebugAdapter;

  const createAdapter = async () => {
    const platform = injector.get('platform');
    const scope = injector.get('scope');
    const events = injector.get('events');
    const config = injector.get('config');
    const router = injector.get('router');
    
    const { initializeDebugAdapter } = await platform.loadModule(debugScript);
    adapter = initializeDebugAdapter({ scope, events, config, router });
  };

  if (location.hostname === 'localhost') {
    createAdapter();
  }

  return {
    dispose() {
      adapter?.dispose();
    },
  };
}
