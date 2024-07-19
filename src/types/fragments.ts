import type { OrderingOptions } from './state';

export interface FragmentsOptions extends OrderingOptions {}

export interface FragmentLoader {
  (name: string, parameters: any, options?: FragmentsOptions): Promise<string>;
}

export interface FragmentsService {
  load: FragmentLoader;
}
