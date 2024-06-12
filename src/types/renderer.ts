import type { ComponentLifecycle, ComponentRef } from './components';

export interface RendererService {
  collect(name: string): Promise<Array<string>>;
  render(component: ComponentRef): ComponentLifecycle;
}
