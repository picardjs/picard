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
  /**
   * The component ID, if any.
   */
  cid?: string;
  /**
   * The name of the component, if no cid is given.
   */
  name?: string;
  /**
   * The source micro frontend of the component, if no cid is given.
   */
  source?: string;
  /**
   * The format of the source micro frontend, if no cid is given and
   * the micro frontend needs to be loaded first.
   */
  format?: string;
  /**
   * The name of the remote, in case of loading a Module Federation (v1) micro frontend.
   */
  remoteName?: string;
  /**
   * The type of the remote, in case of loading a Module Federation (v1) micro frontend.
   */
  remoteType?: 'var' | 'esm';
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
   * The type of the component, if any.
   */
  type?: string;
  /**
   * The additional metadata of the component, if any.
   */
  meta?: any;
}

export interface PicardComponentWithExport extends PicardComponent {
  /**
   * The export of the component.
   */
  exports: any;
}

export interface ComponentDefinition {
  /**
   * The name of the export.
   */
  name: string;
  /**
   * The type of the component, if any.
   */
  type?: string;
  /**
   * The additional metadata of the component, if any.
   */
  meta?: any;
}

export interface AssetDefinition {
  /**
   * The URL of the asset.
   */
  url: string;
  /**
   * The type of the asset (e.g., "css", "wasm", ...).
   */
  type: string;
}

export interface ComponentGetter {
  load(name: string): Promise<any>;
  getComponents(): Array<ComponentDefinition>;
  getAssets(): Array<AssetDefinition>;
}
