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

export interface ModuleFederationManifestV2 {
  id: string;
  name: string;
  metaData: {
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
  };
  shared: Array<{
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
  }>;
  remotes: Array<any>;
  exposes: Array<{
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
  }>;
}

export interface ModuleFederationContainer {
  init(scope: ModuleFederationFactoryScope): void;
  get(name: string): Promise<ModuleFederationFactory>;
}

export interface ModuleFederationEntry {
  id: string;
  url: string;
  type?: 'var' | 'esm';
}
