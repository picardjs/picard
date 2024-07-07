export interface PlatformService {
  loadScript(url: string, integrity?: string, crossOrigin?: string): Promise<void>;
  loadModule(url: string): Promise<any>;
  loadJson<T = any>(url: string): Promise<T>;
}
