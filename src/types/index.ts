import type { StoreApi } from 'zustand/vanilla';

export interface LoadingQueue {
  current: Promise<void>;
  enqueue<T>(cb: () => Promise<T> | T): Promise<T>;
}

export type StaticFeed = Array<PiletDefinition> | DiscoveryResponse | PiletResponse;
export type FeedDefinition = string | StaticFeed | (() => Promise<StaticFeed>);

export interface PiletDefinition {
  name: string;
  version?: string;
  link: string;
  spec?: string;
  custom?: any;
  integrity?: string;
  config?: Record<string, any>;
  dependencies?: Record<string, string>;
}

export interface ModuleFederationFactory {
  (): any;
}

export interface ModuleFederationFactoryScope {
  [depName: string]: {
    [depVersion: string]: {
      from: string;
      eager: boolean;
      loaded?: number;
      get(): Promise<ModuleFederationFactory>;
    };
  };
}

export interface ModuleFederationContainer {
  init(scope: ModuleFederationFactoryScope): void;
  get(name: string): Promise<ModuleFederationFactory>;
}

export interface ComponentGetter {
  load(name: string): Promise<any>;
}

export interface ModuleFederationEntry {
  id: string;
  url: string;
  container?: ComponentGetter;
}

export interface NativeFederationExposedEntry {
  key: string;
  outFileName: string;
}

export interface NativeFederationEntry {
  url: string;
  exposes?: Array<NativeFederationExposedEntry>;
  container?: ComponentGetter;
}

export interface BasePicardMicrofrontend {
  /**
   * The name of the micro frontend.
   */
  name: string;
  /**
   * The component name-to-id mapping.
   */
  components: Record<string, string>;
  /**
   * The source link for the micro frontend.
   */
  source: string;
}

export interface PiletEntry {
  url: string;
  name?: string;
  link?: string;
  container?: ComponentGetter;
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
  /**
   * The id of the component.
   */
  id: string;
  /**
   * The (original) name of the component.
   */
  name: string;
  /**
   * The originating micro frontend.
   */
  origin: PicardMicrofrontend;
  /**
   * The component's lifecycle for rendering.
   */
  render: ComponentLifecycle;
};

export interface PicardContext {
  events: EventEmitter;
}

export interface PicardState {
  microfrontends: Array<PicardMicrofrontend>;
  components: Record<string, Array<PicardComponent>>;
  context: PicardContext;
}

export type PicardStore = StoreApi<PicardState>;

export interface PiletResponse {
  items: Array<PiletDefinition>;
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
 * The map of known events.
 */
export interface PicardEventMap {
  'load-microfrontend': LoadMicrofrontendEvent;
  'loaded-microfrontend': LoadMicrofrontendEvent;
  'unload-microfrontend': UnloadMicrofrontendEvent;
  'unloaded-microfrontend': UnloadMicrofrontendEvent;
  'updated-microfrontends': UpdatedMicrofrontendsEvent;
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
