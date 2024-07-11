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
