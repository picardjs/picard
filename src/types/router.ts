export interface RouterService {
  navigate(route: string, state: any): void;
  findRoutes(): Array<string>;
  dispose(): void;
}
