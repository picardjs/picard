import { emptyLifecycle } from '@/common/utils/lifecycle';
import type { ComponentLifecycle } from '@/types';

export function createLazyLifecycle(load: () => Promise<any>, name: string): ComponentLifecycle {
  const impl = {
    ...emptyLifecycle,
  };
  const lazy = async () => {
    const lc = await load();

    if (!lc) {
      throw new Error(`The component "${name}" could not be loaded.`);
    }

    Object.assign(impl, lc.default || lc);
  };
  return {
    async load(...args) {
      await lazy();
      return await impl.load(...args);
    },
    mount(...args) {
      return impl.mount(...args);
    },
    update(...args) {
      return impl.update(...args);
    },
    unmount(...args) {
      return impl.unmount(...args);
    },
    unload(...args) {
      return impl.unload(...args);
    },
    async bootstrap(...args) {
      await lazy();
      return await impl.bootstrap(...args);
    },
    stringify(...args) {
      return impl.stringify(...args);
    },
  };
}
