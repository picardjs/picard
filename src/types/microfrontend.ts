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
   * The list of asset IDs.
   */
  assets: Array<string>;
  /**
   * The source link for the micro frontend.
   */
  source: string;
  /**
   * Indicates if the MF is active (0), disabled (1), or removed (2).
   */
  flags: 0 | 1 | 2;
}

export interface PiletPicardMicrofrontend extends BasePicardMicrofrontend {
  format: 'pilet';
  details: PiletEntry;
}

export interface ModuleFederationPicardMicrofrontend extends BasePicardMicrofrontend {
  format: 'module';
  details: ModuleFederationEntry;
}

export interface NativeFederationPicardMicrofrontend extends BasePicardMicrofrontend {
  format: 'native';
  details: NativeFederationEntry;
}

export type PicardMicrofrontend =
  | PiletPicardMicrofrontend
  | ModuleFederationPicardMicrofrontend
  | NativeFederationPicardMicrofrontend;
