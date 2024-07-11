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
 * Gets fired when the micro frontends have been changed.
 */
export interface UpdatedMicrofrontendsEvent {
  /**
   * The names of the added micro frontends.
   */
  added: Array<string>;
  /**
   * The names of the removed micro frontends.
   */
  removed: Array<string>;
}

/**
 * Gets fired when dependency has been resolved.
 */
export interface ResolvedDependencyEvent {
  /**
   * The id of the dependency to resolve.
   */
  id: string;
  /**
   * The URL of the parent requesting the dependency.
   */
  parentUrl: string;
  /**
   * The resolved name of the dependency.
   */
  result: string;
}

/**
 * Gets fired when a pi-component mounts.
 */
export interface MountedComponentEvent {
  /**
   * The corresponding HTML element.
   */
  element: HTMLElement;
}

/**
 * Gets fired when a pi-component unmounts.
 */
export interface UnmountedComponentEvent {
  /**
   * The corresponding HTML element.
   */
  element: HTMLElement;
}

/**
 * Gets fired when a pi-slot mounts.
 */
export interface MountedSlotEvent {
  /**
   * The corresponding HTML element.
   */
  element: HTMLElement;
}

/**
 * Gets fired when a pi-slot unmounts.
 */
export interface UnmountedSlotEvent {
  /**
   * The corresponding HTML element.
   */
  element: HTMLElement;
}

/**
 * Gets fired when a pi-component changes data.
 */
export interface ChangedDataEvent {
  /**
   * The currently deserialized data.
   */
  current: any;
  /**
   * The currently available data serialization.
   */
  data: string;
}

/**
 * Gets fired when any event occurs.
 */
export interface AnyEvent {
  /**
   * The name of the event.
   */
  name: string;
  /**
   * The args coming with the event.
   */
  args: any;
}

/**
 * The map of known events.
 */
export interface PicardEventMap {
  'load-microfrontend': LoadMicrofrontendEvent;
  'loaded-microfrontend': LoadMicrofrontendEvent;
  'unload-microfrontend': UnloadMicrofrontendEvent;
  'unloaded-microfrontend': UnloadMicrofrontendEvent;
  'updated-microfrontends': UpdatedMicrofrontendsEvent;
  'resolved-dependency': ResolvedDependencyEvent;
  'mounted-slot': MountedSlotEvent;
  'unmounted-slot': UnmountedSlotEvent;
  'mounted-component': MountedComponentEvent;
  'unmounted-component': UnmountedComponentEvent;
  'changed-data': ChangedDataEvent;
  '*': AnyEvent;
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
export interface EventSystem {
  /**
   * Attaches a new event listener.
   * @param type The type of the event to listen for.
   * @param callback The callback to trigger.
   */
  on<K extends keyof PicardEventMap>(type: string & K, callback: Listener<PicardEventMap[K]>): EventSystem;
  /**
   * Attaches a new event listener that is removed once the event fired.
   * @param type The type of the event to listen for.
   * @param callback The callback to trigger.
   */
  once<K extends keyof PicardEventMap>(type: string & K, callback: Listener<PicardEventMap[K]>): EventSystem;
  /**
   * Detaches an existing event listener.
   * @param type The type of the event to listen for.
   * @param callback The callback to trigger.
   */
  off<K extends keyof PicardEventMap>(type: string & K, callback: Listener<PicardEventMap[K]>): EventSystem;
  /**
   * Emits a new event with the given type.
   * @param type The type of the event to emit.
   * @param arg The payload of the event.
   */
  emit<K extends keyof PicardEventMap>(type: string & K, arg: PicardEventMap[K]): EventSystem;
}
