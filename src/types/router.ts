export interface RouteMatch {
  name: string;
  data: Record<string, string | Array<string>>;
}

export interface RouterService {
  navigate(route: string, state: any): void;
  findRoutes(): Array<string>;
  matchRoute(name: string): undefined | RouteMatch;
  dispose(): void;
}
