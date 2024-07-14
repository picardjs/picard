export interface NativeFederationExposedEntry {
  key: string;
  outFileName: string;
}

export interface NativeFederationEntry {
  url: string;
  exposes?: Array<NativeFederationExposedEntry>;
  dependencies?: Array<NativeFederationDependency>;
}

export interface NativeFederationDependency {
  packageName: string;
  outFileName: string;
  requiredVersion: string;
  singleton: boolean;
  strictVersion: boolean;
  version: string;
}

export interface NativeFederationManifest {
  name: string;
  shared: Array<NativeFederationDependency>;
  exposes: Array<NativeFederationExposedEntry>;
}
