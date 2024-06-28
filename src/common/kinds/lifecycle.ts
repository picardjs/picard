import type { ComponentLifecycle } from '@/types';

const emptyLifecycle: ComponentLifecycle = {
  async bootstrap() {},
  async unload() {},
  mount() {},
  unmount() {},
  update() {},
  stringify() {
    return Promise.resolve('');
  },
};

export function createLazyLifecycle(load: () => Promise<any>, name: string): ComponentLifecycle {
  const impl = {
    ...emptyLifecycle,
  };
  return {
    async bootstrap(...args) {
      const lc = await load();

      if (!lc) {
        throw new Error(`The component "${name}" could not be loaded.`);
      }

      Object.assign(impl, lc.default || lc);
      return await impl.bootstrap(...args);
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
    stringify(...args) {
      return impl.stringify(...args);
    },
  };
}
