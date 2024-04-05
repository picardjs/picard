export interface PiletEntry {
  name?: string;
  version?: string;
  link: string;
  spec?: string;
  custom?: any;
  integrity?: string;
  config?: Record<string, any>;
  dependencies?: Record<string, string>;
}

export interface DiscoveryResponse {
  microFrontends: {
    [name: string]: Array<MicroFrontendDefinition>;
  };
}

export interface MicroFrontendDefinition {
  url: string;
  fallbackUrl?: string;
  metadata?: {
    integrity?: string;
    version?: string;
  };
  extras?: any;
}

export interface ComponentLifecycle {
  mount(container: HTMLElement, params: any): void;
  unmount(container: HTMLElement): void;
  update(params: any): void;
}

/**
 * Gets fired when a micro frontend is about to be loaded or
 * has been loaded.
 */
export interface LoadMicrofrontendEvent {
  /**
   * The name of the micro frontend.
   */
  name: string;
}

/**
 * Gets fired when a micro frontend is about to be unloaded or
 * has been unloaded.
 */
export interface UnloadMicrofrontendEvent {
  /**
   * The name of the micro frontend.
   */
  name: string;
}

/**
 * The map of known events.
 */
export interface PicardEventMap {
  'load-microfrontend': LoadMicrofrontendEvent;
  'loaded-microfrontend': LoadMicrofrontendEvent;
  'unload-microfrontend': UnloadMicrofrontendEvent;
  'unloaded-microfrontend': UnloadMicrofrontendEvent;
  [custom: string]: any;
}

/**
 * Listener for orchestrator events.
 */
export interface Listener<T> {
  /**
   * Receives an event of type T.
   */
  (arg: T): void;
}

/**
 * The emitter for orchestrator events.
 */
export interface EventEmitter {
  /**
   * Attaches a new event listener.
   * @param type The type of the event to listen for.
   * @param callback The callback to trigger.
   */
  on<K extends keyof PicardEventMap>(type: K, callback: Listener<PicardEventMap[K]>): EventEmitter;
  /**
   * Attaches a new event listener that is removed once the event fired.
   * @param type The type of the event to listen for.
   * @param callback The callback to trigger.
   */
  once<K extends keyof PicardEventMap>(type: K, callback: Listener<PicardEventMap[K]>): EventEmitter;
  /**
   * Detaches an existing event listener.
   * @param type The type of the event to listen for.
   * @param callback The callback to trigger.
   */
  off<K extends keyof PicardEventMap>(type: K, callback: Listener<PicardEventMap[K]>): EventEmitter;
  /**
   * Emits a new event with the given type.
   * @param type The type of the event to emit.
   * @param arg The payload of the event.
   */
  emit<K extends keyof PicardEventMap>(type: K, arg: PicardEventMap[K]): EventEmitter;
}
