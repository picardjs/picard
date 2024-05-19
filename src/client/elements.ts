import { defer } from './utils';
import { emptyLifecycle, emptyListener } from './empty';
import type { ComponentLifecycle, ComponentRef, EventEmitter, UpdatedMicrofrontendsEvent } from '../types';

export interface ElementsOptions {
  componentName?: string;
  slotName?: string;
  loadFragment?(name: string, parameters: any): Promise<string>;
  render?(component: ComponentRef): ComponentLifecycle;
  events?: EventEmitter;
  stylesheet?: boolean;
}

const defaultOptions: Required<ElementsOptions> = {
  componentName: 'pi-component',
  slotName: 'pi-slot',
  events: emptyListener,
  stylesheet: true,
  loadFragment() {
    return Promise.resolve('');
  },
  render() {
    return emptyLifecycle;
  },
};

export function createElements(options: ElementsOptions = defaultOptions) {
  const {
    slotName = defaultOptions.slotName,
    componentName = defaultOptions.componentName,
    loadFragment = defaultOptions.loadFragment,
    stylesheet = defaultOptions.stylesheet,
    render = defaultOptions.render,
    events = defaultOptions.events,
  } = options;

  class PiSlot extends HTMLElement {
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

    private get params() {
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
      if (name === 'item-template-id') {
      } else if (name === 'params') {
        defer(() => {
          this.dispatchEvent(new CustomEvent('params-changed', { detail: this.params }));
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
      const fragment = document.createElement('template');
      const itemTemplate = document.getElementById(this.getAttribute('item-template-id') || '');
      fragment.innerHTML = await loadFragment(this.name, this.params);
      this.innerHTML = '';

      if (itemTemplate instanceof HTMLTemplateElement) {
        const template = itemTemplate.content;
        fragment.content.childNodes.forEach((node) => {
          const clonedNode = node.cloneNode(true);
          const item = template.cloneNode(true) as DocumentFragment;
          const slot = item.querySelector('slot');
          slot?.replaceWith(clonedNode);
          this.appendChild(item);
        });
      } else {
        this.appendChild(fragment.content);
      }
    }

    static get observedAttributes() {
      return ['name', 'params', 'group', 'item-template-id'];
    }
  }

  class PiComponent extends HTMLElement {
    private _lc: ComponentLifecycle | undefined;
    private _data: any;
    private _queue: Promise<any> | undefined;
    private handleUpdate = (ev: UpdatedMicrofrontendsEvent) => {
      const source = this.getAttribute('source') || undefined;

      if (source && (ev.added.includes(source) || ev.removed.includes(source))) {
        this.#reset();
      }
    };

    get data() {
      return this._data;
    }

    set data(value: any) {
      this._data = value;
      this.#rerender();
    }

    connectedCallback() {
      events.on('updated-microfrontends', this.handleUpdate);
      this._queue = Promise.resolve();
      this.#bootstrap();

      this.#enqueue(() => {
        const lc = this._lc;

        if (lc) {
          const data = this._data || JSON.parse(this.getAttribute('data') || '{}');
          lc.mount(this, data);
        }
      });
    }

    disconnectedCallback() {
      // just make sure to remove everything
      events.off('updated-microfrontends', this.handleUpdate);
      this._lc?.unmount(this);
      this._lc = undefined;
      this._queue = undefined;
      this.innerHTML = '';
    }

    attributeChangedCallback(name: string, _prev: string, value: string) {
      if (!this._queue) {
        // do nothing
      } else if (name === 'data') {
        this.data = JSON.parse(value || '{}');
      } else if (name === 'cid' || name === 'name' || name === 'source') {
        this.#reset();
      }
    }

    static get observedAttributes() {
      return ['cid', 'data', 'name', 'source'];
    }

    #enqueue(cb: () => void | Promise<void>) {
      this._queue = this._queue?.then(() => {
        if (this.isConnected) {
          return cb();
        }
      });
    }

    #reset() {
      this.disconnectedCallback();
      this.connectedCallback();
    }

    #rerender() {
      this.#enqueue(() => this._lc?.update(this._data));
    }

    #bootstrap() {
      const componentId = this.getAttribute('cid');
      const name = this.getAttribute('name');

      if (componentId) {
        this._lc = render(componentId);
      } else if (name) {
        const source = this.getAttribute('source') || undefined;
        this._lc = render({ name, source });
      }

      this.#enqueue(() => this._lc?.bootstrap());
    }
  }

  if (stylesheet) {
    const style = document.createElement('style');
    style.textContent = `
      ${slotName} { display: contents; }
      ${componentName} { display: contents; }
    `;
    document.head.appendChild(style);
  }

  customElements.define(slotName, PiSlot);
  customElements.define(componentName, PiComponent);
}
