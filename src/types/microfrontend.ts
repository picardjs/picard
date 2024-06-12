import type { ModuleFederationEntry } from './module-federation';
import type { NativeFederationEntry } from './native-federation';
import type { PiletEntry } from './pilet';

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
