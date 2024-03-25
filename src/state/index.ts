import { createStore } from 'zustand/vanilla';

/**
 * Creates a new scope for obtaining MF information.
 */
export function createPicardScope() {
  const store = createStore((set) => ({}));
  return store;
}
