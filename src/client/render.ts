import type { ComponentLifecycle } from '../types';

export function createRenderer(state: any) {
  return (): ComponentLifecycle => ({
    mount() {

    },
    unmount() {

    },
    update() {

    },
  });
}
