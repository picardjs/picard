import { createStore } from 'zustand/vanilla';
import type { PicardState } from '@/types';

export function initializeStore(initialState: any = {}) {
  return createStore<PicardState>(() => ({
    ...initialState,
    microfrontends: [...(initialState.microfrontends || [])],
    assets: {
      ...(initialState.assets || {}),
    },
    components: {
      ...(initialState.components || {}),
    },
  }));
}
