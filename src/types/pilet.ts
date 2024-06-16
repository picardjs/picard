import { ComponentLifecycle } from './components';

export interface PiletDefinition {
  name: string;
  version?: string;
  link: string;
  spec?: string;
  custom?: any;
  integrity?: string;
  config?: Record<string, any>;
  dependencies?: Record<string, string>;
}

export interface PiletResponse {
  items: Array<PiletDefinition>;
}

export interface PiletEntry {
  name?: string;
  url: string;
}

export interface PiletMeta {
  basePath: string;
}

export interface PiletApi {
  registerComponent(name: string, component: ComponentLifecycle): void;
  meta: PiletMeta;
}

export interface PiletService {
  extend(api: PiletApi): void;
}
