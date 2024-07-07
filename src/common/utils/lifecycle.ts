import type { ComponentLifecycle } from '@/types';

export const emptyLifecycle: ComponentLifecycle = {
  async bootstrap() {},
  async unload() {},
  mount() {},
  unmount() {},
  update() {},
  stringify() {
    return Promise.resolve('');
  },
};
