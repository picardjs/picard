import type { PicardMicrofrontend } from './microfrontend';

export interface ComponentLifecycle {
  bootstrap(): Promise<void>;
  unload(): Promise<void>;

  mount(container: HTMLElement, params: any, locals: any): void;
  unmount(container: HTMLElement, locals: any): void;
  update(params: any, locals: any): void;

  stringify(params: any): Promise<string>;
}

export interface ComponentRef {
  cid?: string;
  name?: string;
  source?: string;
  kind?: string;
  container?: string;
  framework?: string;
}

export interface PicardComponent {
  /**
   * The id of the component.
   */
  id: string;
  /**
   * The (original) name of the component.
   */
  name: string;
  /**
   * The originating micro frontend.
   */
  origin: PicardMicrofrontend;
  /**
   * The component's lifecycle for rendering.
   */
  render: ComponentLifecycle;
}

export interface ComponentGetter {
  load(name: string): Promise<any>;
}
