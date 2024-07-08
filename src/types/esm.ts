export interface EsmService {
  load(url: string, depMap: Record<string, string>): Promise<any>;
}
