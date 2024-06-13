import type { ComponentLifecycle } from '../types';

export const emptyLifecycle: ComponentLifecycle = {
  async bootstrap() {},
  async unload() {},
  mount() {},
  unmount() {},
  update() {},
  stringify() {
    return '';
  }
};

export function createLazyLifecycle(load: () => Promise<any>): ComponentLifecycle {
  const impl = {
    ...emptyLifecycle,
  };
  return {
    async bootstrap(...args) {
      const component = await load();
      Object.assign(impl, component.default || component);
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
    stringify() {
      return '';
    },
  };
}
