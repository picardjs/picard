import type { PicardAsset } from './assets';
import type { PicardMicrofrontend } from './microfrontend';
import type { Dispose } from './utils';
import type {
  AssetDefinition,
  ComponentDefinition,
  ComponentRef,
  PicardComponent,
  PicardComponentWithExport,
} from './components';

export interface PicardState {
  microfrontends: Array<PicardMicrofrontend>;
  components: Record<string, Array<PicardComponent>>;
  assets: Record<string, Array<PicardAsset>>;
}

export interface PicardStore {
  dispose(): void;
  readState(): PicardState;
  saveSnapshot(): string;
  subscribe(listener: (curr: PicardState, prev: PicardState) => void): Dispose;
  loadMicrofrontends(loader: Promise<Array<PicardMicrofrontend>>): Promise<void>;
  loadComponents(name: string): Promise<Array<string>>;
  loadAssets(type: string): Promise<Array<string>>;
  getComponent(ref: ComponentRef): Promise<PicardComponentWithExport>;
  removeMicrofrontend(origin: string): void;
  removeMicrofrontends(origins: Array<string>): void;
  updateMicrofrontend(origin: string, details: Partial<PicardMicrofrontend>): void;
  appendMicrofrontend(mf: PicardMicrofrontend): void;
  appendMicrofrontends(mfs: Array<PicardMicrofrontend>): void;
  toggleMicrofrontend(origin: string): void;
  registerComponent(mf: PicardMicrofrontend, component: ComponentDefinition): PicardComponent;
  registerAsset(mf: PicardMicrofrontend, asset: AssetDefinition): PicardAsset;
  retrieveComponent(id: string): PicardComponent | undefined;
  retrieveAsset(id: string): PicardAsset | undefined;
}
