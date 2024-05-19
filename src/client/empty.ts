import type { ComponentLifecycle, EventEmitter } from '../types';

export const emptyLifecycle: ComponentLifecycle = {
  async bootstrap() {},
  async unload() {},
  mount() {},
  unmount() {},
  update() {},
};

export const emptyListener: EventEmitter = {
  on() {
    return this;
  },
  emit() {
    return this;
  },
  off() {
    return this;
  },
  once() {
    return this;
  },
};
