import type { PicardMicrofrontend } from './microfrontend';

export interface ComponentLifecycle {
  bootstrap(): Promise<void>;
  unload(): Promise<void>;

  mount(container: HTMLElement, params: any): void;
  unmount(container: HTMLElement): void;
  update(params: any): void;

  stringify(params: any): string;
}

export type ComponentRef =
  | string
  | {
      name: string;
      source?: string;
    };

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
