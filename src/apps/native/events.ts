import type { EventSystem } from '@/types';

/**
 * Creates a new Piral app shell event emitter.
 * Uses a custom event dispatcher with a state for usage control.
 * @returns The event emitter.
 */
export function createListener(): EventSystem {
  const emitter: Record<string, Array<(ev: any) => void>> = {};
  const getArray = (type: string) => emitter[type] || (emitter[type] = []);

  const events: EventSystem = {
    on(type, callback) {
      getArray(type).push(callback);
      return events;
    },
    off(type, callback) {
      const arr = getArray(type);
      const idx = arr.indexOf(callback);
      idx >= 0 && arr.splice(idx, 1);
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
