import type { OrderingOptions } from "./state";

export interface FragmentsOptions extends OrderingOptions {}

export interface FragmentsService {
  load(name: string, parameters: any, options?: FragmentsOptions): Promise<string>;
}
