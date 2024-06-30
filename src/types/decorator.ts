export interface DecoratorService {
  render(name: string, parameters: any): Promise<string>;
  decorate(content: string): Promise<string>;
}
