import type { ComponentLifecycle } from '../types';

export interface CustomElementsOptions {
  componentName?: string;
  slotName?: string;
  loadFragment?(name: string, parameters: any): Promise<string>;
  render?(component: string): ComponentLifecycle;
}

const defaultOptions: Required<CustomElementsOptions> = {
  componentName: 'pi-component',
  slotName: 'pi-slot',
  loadFragment() {
    return Promise.resolve('');
  },
  render() {
    return {
      mount() {},
      unmount() {},
      update() {},
    };
  },
};

function defer(cb: () => void) {
  setTimeout(cb, 0);
}

export function createCustomElements(options: CustomElementsOptions = defaultOptions) {
  const {
    slotName = defaultOptions.slotName,
    componentName = defaultOptions.componentName,
    loadFragment = defaultOptions.loadFragment,
    render = defaultOptions.render,
  } = options;

  class PiSlot extends HTMLElement {
    private _params: any;

    get name() {
      return this.getAttribute('name') || '';
    }

    set name(value: string) {
      this.setAttribute('name', value);
    }

    get group() {
      return this.getAttribute('group') || '';
    }

    set group(value: string) {
      this.setAttribute('group', value);
    }

    private get parameters() {
      return JSON.parse(this.getAttribute('params') || '{}');
    }

    async connectedCallback() {
      const prepared = !this.group.startsWith('client-');

      if (!prepared) {
        await this.setupChildren();
      }
    }

    disconnectedCallback() {
      // just make sure to remove everything
      this.innerHTML = '';
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
      if (name === 'params') {
        defer(() => {
          this.dispatchEvent(new CustomEvent('params-changed', { detail: this.parameters }));
        });
      } else if (name === 'name' && newValue !== oldValue) {
        // this is a worst-case scenario, we need to throw away everything
        this.innerHTML = '';

        if (newValue) {
          this.rerender();
        }
      }
    }

    async rerender() {
      await this.setupChildren();
    }

    async setupChildren() {
      this.outerHTML = await loadFragment(this.name, this.parameters);
    }

    static get observedAttributes() {
      return ['name', 'params', 'group'];
    }
  }

  class PiComponent extends HTMLElement {
    private _lc: ComponentLifecycle | undefined;
    private _data: any;

    get data() {
      return this._data;
    }

    set data(value: any) {
      this._data = value;
      this.rerender();
    }

    connectedCallback() {
      const componentId = this.getAttribute('cid');

      if (componentId) {
        const data = this._data || JSON.parse(this.getAttribute('data') || '{}');
        const lc = render(componentId);
        lc.mount(this, data);
        this._lc = lc;
      }
    }

    disconnectedCallback() {
      const lc = this._lc;

      if (lc) {
        // just make sure to remove everything
        lc.unmount(this);
        this._lc = undefined;
      }

      this.innerHTML = '';
    }

    rerender() {
      const lc = this._lc;

      if (lc) {
        lc.update(this._data);
      }
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
      if (name === 'data') {
        this.data = JSON.parse(newValue || '{}');
      } else if (name === 'cid') {
      }
    }

    static get observedAttributes() {
      return ['cid', 'data'];
    }
  }

  customElements.define(slotName, PiSlot);
  customElements.define(componentName, PiComponent);
}
