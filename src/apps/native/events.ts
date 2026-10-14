import type { EventSystem } from '@/types';

/**
 * Creates a new Piral app shell event emitter.
 * Uses a custom event dispatcher with a state for usage control.
 * @returns The event emitter.
 */
export function createListener(): EventSystem {
  const emitter: Record<string, Set<(ev: any) => void>> = {};
  const getArray = (type: string) => emitter[type] || (emitter[type] = new Set());

  const events: EventSystem = {
    on(type, callback) {
      getArray(type).add(callback);
      return events;
    },
    off(type, callback) {
      getArray(type).delete(callback);
      return events;
    },
    once(type, callback) {
      const cb = (e: any) => {
        events.off(type, cb);
        callback(e);
      };
      events.on(type, callback);
      return events;
    },
    emit(name, args) {
      emitter[name]?.forEach((cb) => cb(args));
      const alt = { name, args };
      emitter['*']?.forEach((cb) => cb(alt));
      return events;
    },
  };

  return events;
}
