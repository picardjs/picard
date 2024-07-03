export interface ModuleResolver {
  (): any | Promise<any>;
}

export interface DependencyModule {
  id: string;
  name: string;
  version: string;
}

export interface LoaderService {
  registerUrls(dependencies: Record<string, string>): void;
  registerResolvers(dependencies: Record<string, () => ModuleResolver>): void;
  registerModule(url: string, content: any): void;
  load(url: string): Promise<any>;
  import(id: string, parent?: string): Promise<any>;
  list(): Array<DependencyModule>;
}
