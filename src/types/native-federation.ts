export interface NativeFederationExposedEntry {
  key: string;
  outFileName: string;
}

export interface NativeFederationEntry {
  url: string;
  exposes?: Array<NativeFederationExposedEntry>;
}

export interface NativeFederationManifest {
  name: string;
  shared: Array<{
    packageName: string;
    outFileName: string;
    requiredVersion: string;
    singleton: boolean;
    strictVersion: boolean;
    version: string;
  }>;
  exposes: Array<NativeFederationExposedEntry>;
}
