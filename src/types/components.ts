export interface ComponentLifecycle {
  load(): Promise<void>;
  unload(): Promise<void>;

  mount(container: HTMLElement, props: any, locals: any): void;
  unmount(container: HTMLElement, locals: any): void;
  update(props: any, locals: any): void;

  bootstrap(): Promise<void>;
  stringify(props: any): Promise<string>;
}

export interface ComponentRef {
  cid?: string;
  name?: string;
  source?: string;
  format?: string;
  framework?: string;
  remoteName?: string;
  remoteType?: string;
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
   * The name of the originating micro frontend.
   */
  origin: string;
  /**
   * The component's lifecycle for rendering.
   */
  render: ComponentLifecycle;
}

export interface ComponentGetter {
  load(name: string): Promise<any>;
  getNames(): Array<string>;
  getAssets(): Array<{ url: string; type: string }>;
}
