import type { ComponentLifecycle, ComponentRef } from './components';

export interface RendererService {
  render(component: ComponentRef): ComponentLifecycle;
}
