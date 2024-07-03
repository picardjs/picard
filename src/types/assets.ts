import type { PicardMicrofrontend } from './microfrontend';

export interface PicardAsset {
  /**
   * The id of the asset.
   */
  id: string;
  /**
   * The URL of the asset.
   */
  url: string;
  /**
   * The type of the component (e.g., "css", "wasm" ec.).
   */
  type: string;
  /**
   * The name of the originating micro frontend.
   */
  origin: string;
}
