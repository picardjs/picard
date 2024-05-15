import type { StoreApi } from 'zustand/vanilla';

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

export interface ModuleFederationEntry {}

export interface NativeFederationEntry {}

export interface BasePicardMicrofrontend {
  name: string;
  components: Record<string, string>;
  source: string;
}

export interface PiletPicardMicrofrontend extends BasePicardMicrofrontend {
  kind: 'pilet';
  details: PiletEntry;
}

export interface ModuleFederationPicardMicrofrontend extends BasePicardMicrofrontend {
  kind: 'mf';
  details: ModuleFederationEntry;
}

export interface NativeFederationPicardMicrofrontend extends BasePicardMicrofrontend {
  kind: 'nf';
  details: NativeFederationEntry;
}

export type PicardMicrofrontend =
  | PiletPicardMicrofrontend
  | ModuleFederationPicardMicrofrontend
  | NativeFederationPicardMicrofrontend;

export interface PicardComponent {
  id: string;
  name: string;
  origin: PicardMicrofrontend;
  render: ComponentLifecycle;
};

export interface PicardState {
  microfrontends: Array<PicardMicrofrontend>;
  components: Record<string, Array<PicardComponent>>;
}

export type PicardStore = StoreApi<PicardState>;

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

export type ComponentRef =
  | string
  | {
      name: string;
      source?: string;
    };

export interface ComponentLifecycle {
  bootstrap(): Promise<void>;
  unload(): Promise<void>;

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
