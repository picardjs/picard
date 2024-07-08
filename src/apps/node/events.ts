import { EventEmitter } from 'events';
import type { EventSystem } from '@/types';

/**
 * Creates a new Piral app shell event emitter.
 * Uses a custom event dispatcher with a state for usage control.
 * @returns The event emitter.
 */
export function createListener(): EventSystem {
  const emitter = new EventEmitter();

  const events: EventSystem = {
    on(type, callback) {
      emitter.on(type, callback);
      return events;
    },
    once(type, callback) {
      emitter.once(type, callback);
      return events;
    },
    off(type, callback) {
      emitter.off(type, callback);
      return events;
    },
    emit(name, args) {
      emitter.emit(name, args);
      emitter.emit('*', { name, args });
      return events;
    },
  };

  return events;
}
