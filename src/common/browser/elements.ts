import type { ComponentLifecycle, DependencyInjector, UpdatedMicrofrontendsEvent } from '@/types';

const attrName = 'name';
const attrGroup = 'group';
const attrFallback = 'fallback';
const attrParams = 'params';
const attrTemplateId = 'item-template-id';
const attrSource = 'source';
const attrKind = 'kind';
const attrContainer = 'container';
const attrFramework = 'framework';
const attrData = 'data';
const attrCid = 'cid';

function tryJson(content: string, fallback: any) {
  if (content) {
    try {
      return JSON.parse(content);
    } catch {
      // empty on purpose
    }
  }
  return fallback;
}

export function createElements(injector: DependencyInjector) {
  const config = injector.get('config');
  const renderer = injector.get('renderer');
  const fragments = injector.get('fragments');
  const events = injector.get('events');

  const { componentName, slotName, stylesheet } = config;

  class PiSlot extends HTMLElement {
    private _empty = false;

    get name() {
      return this.getAttribute(attrName) || '';
    }

    set name(value: string) {
      this.setAttribute(attrName, value);
    }

    get group() {
      return this.getAttribute(attrGroup) || '';
    }

    set group(value: string) {
      this.setAttribute(attrGroup, value);
    }

    get fallback() {
      return this.getAttribute(attrFallback) || '';
    }

    set fallback(value: string) {
      this.setAttribute(attrFallback, value);
    }

    private get params() {
      return tryJson(this.getAttribute(attrParams), {});
    }

    async connectedCallback() {
      const prepared = !this.group.startsWith('client-');

      if (!prepared) {
        await this.#setupChildren();
      }
    }

    disconnectedCallback() {
      // just make sure to remove everything
      this.innerHTML = '';
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
      if (name === attrTemplateId && newValue !== oldValue) {
        this.#rerender();
      } else if (name === attrParams) {
        this.dispatchEvent(new CustomEvent('params-changed', { detail: this.params }));
      } else if (name === attrName && newValue !== oldValue) {
        this.#rerender();
      } else if (name === attrFallback && newValue !== oldValue && this._empty) {
        this.#rerender();
      }
    }

    async #rerender() {
      // this is a worst-case scenario, we need to throw away everything
      this.innerHTML = '';

      if (this.name) {
        await this.#setupChildren();
      }
    }

    async #setupChildren() {
      const fragment = document.createElement('template');
      const itemTemplate = document.getElementById(this.getAttribute(attrTemplateId) || '');
      const content = await fragments.load(this.name, this.params);
      this._empty = !!content;
      fragment.innerHTML = content || this.fallback || '';
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
      return [attrName, attrParams, attrGroup, attrTemplateId, attrFallback];
    }
  }

  class PiComponent extends HTMLElement {
    private _lc: ComponentLifecycle | undefined;
    private _locals: any = {};
    private _data: any;
    private _queue: Promise<any> | undefined;
    private handleUpdate = (ev: UpdatedMicrofrontendsEvent) => {
      const source = this.getAttribute(attrSource) || undefined;

      if (source) {
        if (ev.removed.includes(source)) {
          this.#reset();
        } else if (ev.added.includes(source) && this._lc !== undefined) {
          this.#reset();
        }
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
      this.#start();
      events.emit('mounted-component', { element: this });
    }

    disconnectedCallback() {
      // just make sure to remove everything
      events.off('updated-microfrontends', this.handleUpdate);
      this.#clean();
      events.emit('unmounted-component', { element: this });
    }

    attributeChangedCallback(name: string, _prev: string, value: string) {
      if (!this._queue) {
        // do nothing
      } else if (name === attrData) {
        this.data = tryJson(value, {});
      } else if (name === attrCid || name === attrName || name === attrSource) {
        this.#reset();
      }
    }

    static get observedAttributes() {
      return [attrCid, attrData, attrName, attrSource];
    }

    #clean() {
      const lc = this._lc;
      lc?.unmount(this, this._locals);
      this._lc = undefined;
      this._locals = {};
      this._queue = undefined;
      this.innerHTML = '';
    }

    #start() {
      this._queue = Promise.resolve();
      this.#bootstrap();

      this.#enqueue(() => {
        const lc = this._lc;

        if (lc) {
          const data = this._data || tryJson(this.getAttribute(attrData), {});
          lc.mount(this, data, this._locals);
        }
      });
    }

    #enqueue(cb: () => void | Promise<void>) {
      this._queue = this._queue?.then(() => {
        if (this.isConnected) {
          return cb();
        }
      });
    }

    #reset() {
      this.#clean();
      this.#start();
    }

    #rerender() {
      this.#enqueue(() => this._lc?.update(this._data, this._locals));
    }

    #bootstrap() {
      const cid = this.getAttribute(attrCid);
      const name = this.getAttribute(attrName);

      if (cid) {
        this._lc = renderer.render({ cid });
      } else if (name) {
        const source = this.getAttribute(attrSource);
        const container = this.getAttribute(attrContainer);
        const kind = this.getAttribute(attrKind);
        const framework = this.getAttribute(attrFramework);
        this._lc = renderer.render({ name, source, container, kind, framework });
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

  return {};
}
