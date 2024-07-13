import type { ComponentLifecycle } from '@/types';

export const emptyLifecycle: ComponentLifecycle = {
  async load() {},
  async unload() {},
  mount() {},
  unmount() {},
  update() {},
  async bootstrap() {},
  stringify() {
    return Promise.resolve('');
  },
};

export function createLazyLifecycle(load: () => Promise<any>): ComponentLifecycle {
  const impl = {
    ...emptyLifecycle,
  };
  const lazy = async () => {
    const lc = await load();
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
