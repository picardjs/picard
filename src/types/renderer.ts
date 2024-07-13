import type { ComponentLifecycle, ComponentRef } from './components';

export interface RenderOptions {
  framework?: string;
}

export interface RendererService {
  render(component: ComponentRef, opts: RenderOptions): ComponentLifecycle;
}
