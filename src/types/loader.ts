export interface ModuleResolver {
  (): any | Promise<any>;
}

export interface DependencyModule {
  name: string;
  version: string;
  get(): Promise<any>;
}

export interface LoaderService {
  registerUrls(dependencies: Record<string, string>): void;
  registerResolvers(dependencies: Record<string, () => ModuleResolver>): void;
  load(url: string): Promise<any>;
  list(): Array<DependencyModule>;
}
