export interface EsmService {
  load(url: string, depMap: Record<string, string>, parent: string): Promise<any>;
}
