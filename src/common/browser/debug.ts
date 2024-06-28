import type { DependencyInjector } from '@/types';

const selfSource = 'piral-debug-api';
const debugApiVersion = 'v1';
const debugScript = './picard-debug.mjs';

interface DebugAdapter {
  forward(content: any): void;
  dispose(): void;
}

export function createDebug(injector: DependencyInjector) {
  let adapter: DebugAdapter;

  const dispatchToScript = async (content: any) => {
    if (!adapter) {
      const { initializeDebugAdapter } = await import(debugScript);
      const scope = injector.get('scope');
      const events = injector.get('events');
      const config = injector.get('config');
      const router = injector.get('router');
      adapter = initializeDebugAdapter({ scope, events, config, router });
    }

    adapter.forward(content);
  };

  const handler = (event: MessageEvent) => {
    const { source, version, content } = event.data;

    if (source !== selfSource && version === debugApiVersion) {
      dispatchToScript(content);
    }
  };

  window.addEventListener('message', handler);

  return {
    dispose() {
      window.removeEventListener('message', handler);
      adapter?.dispose();
    },
  };
}
