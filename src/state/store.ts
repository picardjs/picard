import { createStore } from 'zustand/vanilla';
import type { EventEmitter, PicardState, PicardStore } from '../types';

/**
 * Creates a new scope for obtaining MF information.
 */
export function createPicardScope(state: Partial<PicardState>, events: EventEmitter): PicardStore {
  return createStore<PicardState>(() => ({
    ...state,
    microfrontends: [...(state.microfrontends || [])],
    components: {
      ...(state.components || {}),
    },
    context: {
      events,
    },
  }));
}
