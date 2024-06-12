import { createStore } from 'zustand/vanilla';
import type { DependencyInjector, PicardState, PicardStore } from '../types';

/**
 * Creates a new scope for obtaining MF information.
 */
export function createPicardScope(injector: DependencyInjector): PicardStore {
  const { state } = injector.get('config');
  const events = injector.get('events');

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
