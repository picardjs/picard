import type { ComponentLifecycle } from '../types';

export const empty: ComponentLifecycle = {
  async bootstrap() {},
  async unload() {},
  mount() {},
  unmount() {},
  update() {},
};
