import { EventEmitter } from 'events';

/**
 * Creates a new Piral app shell event emitter.
 * Uses a custom event dispatcher with a state for usage control.
 * @param state The optional state object to identify the instance.
 * @returns The event emitter.
 */
export function createListener(state: any = {}): EventEmitter {
  const emitter = new EventEmitter();
  return emitter;
}
