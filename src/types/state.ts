import type { StoreApi } from 'zustand/vanilla';
import type { PicardMicrofrontend } from './microfrontend';
import type { PicardComponent } from './components';

export interface PicardState {
  microfrontends: Array<PicardMicrofrontend>;
  components: Record<string, Array<PicardComponent>>;
}

export type PicardStore = StoreApi<PicardState>;
