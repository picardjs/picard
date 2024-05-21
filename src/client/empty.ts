import type { EventEmitter } from '../types';

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
