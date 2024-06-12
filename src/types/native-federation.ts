import type { ComponentGetter } from './components';

export interface NativeFederationExposedEntry {
  key: string;
  outFileName: string;
}

export interface NativeFederationEntry {
  url: string;
  exposes?: Array<NativeFederationExposedEntry>;
  container?: ComponentGetter;
}
