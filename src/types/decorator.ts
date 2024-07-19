import type { FragmentLoader } from './fragments';

export interface DecoratorService {
  render: FragmentLoader;
  decorate(content: string): Promise<string>;
}
