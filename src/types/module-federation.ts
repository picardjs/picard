export interface ModuleFederationFactory {
  (): any;
}

export interface ModuleFederationFactoryScope {
  [depName: string]: {
    [depVersion: string]: {
      from: string;
      eager: boolean;
      strategy?: 'loaded-first' | 'version-first';
      loaded?: number | boolean;
      version?: string;
      get(): Promise<ModuleFederationFactory>;
    };
  };
}

export interface ModuleFederationManifestV2MetaData {
  name: string;
  type: 'app';
  buildInfo: {
    buildVersion: string;
    buildName: string;
  };
  remoteEntry: {
    name: string;
    path: string;
    type: 'global' | 'module';
  };
  types: {
    path: string;
    name: string;
    zip: string;
    api: string;
  };
  globalName: string;
  pluginVersion: string;
  publicPath: string;
}

export interface ModuleFederationManifestV2SharedDependency {
  id: string;
  name: string;
  version: string;
  singleton: boolean;
  requiredVersion: string;
  assets: {
    js: {
      async: Array<string>;
      sync: Array<string>;
    };
    css: {
      sync: Array<string>;
      async: Array<string>;
    };
  };
}

export interface ModuleFederationManifestV2Exposed {
  id: string;
  name: string;
  assets: {
    js: {
      sync: Array<string>;
      async: Array<string>;
    };
    css: {
      sync: Array<string>;
      async: Array<string>;
    };
  };
  path: string;
}

export interface ModuleFederationManifestV2 {
  id: string;
  name: string;
  metaData: ModuleFederationManifestV2MetaData;
  shared: Array<ModuleFederationManifestV2SharedDependency>;
  remotes: Array<any>;
  exposes: Array<ModuleFederationManifestV2Exposed>;
}

export interface ModuleFederationContainer {
  init(scope: ModuleFederationFactoryScope): void;
  get(name: string): Promise<ModuleFederationFactory>;
}

export interface ModuleFederationEntry {
  id: string;
  url: string;
  type?: 'var' | 'esm' | 'global' | 'module';
  runtime?: '1.0' | '1.5' | '2.0';
  metaData?: ModuleFederationManifestV2MetaData;
  shared?: Array<ModuleFederationManifestV2SharedDependency>;
  remotes?: Array<any>;
  exposes?: Array<ModuleFederationManifestV2Exposed>;
}
