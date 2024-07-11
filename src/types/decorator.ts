import type { Document } from 'domhandler';

export interface DecoratorService {
  render(name: string, parameters: any): Promise<string>;
  decorate(content: string): Promise<string>;
}

export interface PartService {
  getReplacement(document: Document, attribs: Record<string, string>): Promise<string>;
}
