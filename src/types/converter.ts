import type { ComponentLifecycle } from './components';

export interface ConverterService {
  convert(component: any, opts: any): ComponentLifecycle;
}
