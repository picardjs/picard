import type { Document } from 'domhandler';

export interface PartService {
  getReplacement(document: Document, attribs: Record<string, string>): Promise<string>;
}
