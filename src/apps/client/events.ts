import type { EventEmitter } from '@/types';

type EventListeners = Array<[any, any]>;

function nameOf(name: string | number): any {
  return `picard:${name}`;
}

function dispatch(name: string | number, args: any) {
  document.body.dispatchEvent(
    new CustomEvent(nameOf(name), {
      bubbles: false,
      cancelable: false,
      detail: args,
    }),
  );
}

/**
 * Creates a new Piral app shell event emitter.
 * Uses a custom event dispatcher with a state for usage control.
 * @returns The event emitter.
 */
export function createListener() {
  const eventListeners: EventListeners = [];
  const events: EventEmitter = {
    on(type, callback) {
      const listener = ({ detail }: CustomEvent) => detail && callback(detail);
      document.body.addEventListener(nameOf(type), listener);
      eventListeners.push([callback, listener]);
      return events;
    },
    once(type, callback) {
      const cb = (ev: any) => {
        events.off(type, cb);
        callback(ev);
      };
      return events.on(type, cb);
    },
    off(type, callback) {
      const [listener] = eventListeners.filter((m) => m[0] === callback);

      if (listener) {
        document.body.removeEventListener(nameOf(type), listener[1]);
        eventListeners.splice(eventListeners.indexOf(listener), 1);
      }

      return events;
    },
    emit(name, args) {
      dispatch(name, args);
      dispatch('*', { name, args });
      return events;
    },
  };

  return events;
}
