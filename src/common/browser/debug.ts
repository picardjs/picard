import type { DependencyInjector } from '@/types';

interface DebugAdapter {
  dispose(): void;
}

export function createDebug(injector: DependencyInjector) {
  let adapter: DebugAdapter;

  const createAdapter = async () => {
    const scope = injector.get('scope');
    const events = injector.get('events');
    const config = injector.get('config');
    const router = injector.get('router');
    
    const { initializeDebugAdapter } = await import('../debug');
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
