import type { ComponentGetter } from './components';

export interface ModuleFederationFactory {
  (): any;
}

export interface ModuleFederationFactoryScope {
  [depName: string]: {
    [depVersion: string]: {
      from: string;
      eager: boolean;
      loaded?: number;
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
  container?: ComponentGetter;
}
