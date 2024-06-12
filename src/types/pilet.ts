import type { ComponentGetter } from './components';

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
  url: string;
  name?: string;
  link?: string;
  container?: ComponentGetter;
}
