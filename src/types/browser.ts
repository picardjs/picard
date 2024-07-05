export interface PiComponentProps {
  cid?: string;
  source?: string;
  name?: string;
  data?: string;
  kind?: string;
  framework?: string;
  container?: string;
  'fallback-template-id'?: string;
}

export interface PiSlotProps {
  name: string;
  rel?: string;
  data?: string;
  'item-template-id'?: string;
  'fallback-template-id'?: string;
}

export interface PiPartProps {
  name: string;
}

type CustomElementProps<T> = T & {
  key?: string | number | BigInt | null | undefined;
  ref?: string | ((element: T) => void) | { readonly current: T } | undefined;
};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'pi-component': CustomElementProps<PiComponentProps>;
      'pi-slot': CustomElementProps<PiSlotProps>;
      'pi-part': CustomElementProps<PiPartProps>;
    }
  }

  interface HTMLElementTagNameMap {
    'pi-component': HTMLElement & PiComponentProps;
    'pi-slot': HTMLElement & PiSlotProps;
    'pi-part': HTMLElement & PiPartProps;
  }
}
