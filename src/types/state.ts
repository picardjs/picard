import type { StoreApi } from 'zustand/vanilla';
import type { EventEmitter } from './events';
import type { PicardMicrofrontend } from './microfrontend';
import type { PicardComponent } from './components';

export interface PicardContext {
  events: EventEmitter;
}

export interface PicardState {
  microfrontends: Array<PicardMicrofrontend>;
  components: Record<string, Array<PicardComponent>>;
  context: PicardContext;
}

export type PicardStore = StoreApi<PicardState>;
