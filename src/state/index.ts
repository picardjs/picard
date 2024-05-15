import { createStore } from 'zustand/vanilla';
import type { PicardState, PicardStore } from '../types';

/**
 * Creates a new scope for obtaining MF information.
 */
export function createPicardScope(state: Partial<PicardState>): PicardStore {
  const store = createStore<PicardState>((set) => ({
    ...state,
    microfrontends: [...(state.microfrontends || [])],
    components: {
      ...(state.components || {}),
    },
  }));
  return store;
}
