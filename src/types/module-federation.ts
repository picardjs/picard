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

export interface ModuleFederationContainer {
  init(scope: ModuleFederationFactoryScope): void;
  get(name: string): Promise<ModuleFederationFactory>;
}

export interface ModuleFederationEntry {
  id: string;
  url: string;
  type?: 'var' | 'esm';
}
