import type { PicardAsset } from './assets';
import type { PicardMicrofrontend } from './microfrontend';
import type { ComponentLifecycle, ComponentRef, PicardComponent } from './components';
import type { Dispose } from './utils';

export interface PicardState {
  microfrontends: Array<PicardMicrofrontend>;
  components: Record<string, Array<PicardComponent>>;
  assets: Record<string, Array<PicardAsset>>;
}

export interface PicardStore {
  readState(): PicardState;
  saveSnapshot(): string;
  subscribe(listener: (curr: PicardState, prev: PicardState) => void): Dispose;
  loadMicrofrontends(loader: Promise<Array<PicardMicrofrontend>>): Promise<void>;
  loadLifecycle(component: ComponentRef): ComponentLifecycle;
  loadComponents(name: string): Promise<Array<string>>;
  loadAssets(type: string): Promise<Array<string>>;
  removeMicrofrontend(name: string): void;
  removeMicrofrontends(names: Array<string>): void;
  updateMicrofrontend(name: string, details: any): void;
  appendMicrofrontend(mf: PicardMicrofrontend): void;
  appendMicrofrontends(mfs: Array<PicardMicrofrontend>): void;
  registerComponent(mf: PicardMicrofrontend, name: string, lifecycle: ComponentLifecycle): PicardComponent;
  registerAsset(mf: PicardMicrofrontend, url: string, type: string): PicardAsset;
  retrieveComponent(id: string): PicardComponent | undefined;
  retrieveLifecycle(id: string): ComponentLifecycle;
  retrieveAsset(id: string): PicardAsset | undefined;
}
