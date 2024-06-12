export interface FragmentsService {
  load(name: string, parameters: any): Promise<string>;
}
