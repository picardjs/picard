export interface NativeFederationExposedEntry {
  key: string;
  outFileName: string;
}

export interface NativeFederationEntry {
  url: string;
  exposes?: Array<NativeFederationExposedEntry>;
}
