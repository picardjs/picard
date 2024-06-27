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

interface ElementQueue {
  enqueue<T>(cb: (prev: any) => T | Promise<T>): void;
  reset(): void;
}

function createQueue(): ElementQueue {
  const queue: Array<(rev: any) => any> = [];
  const process = (prev: any) => {
    const cb = queue.shift();
    return cb?.(prev);
  };
  let current = Promise.resolve();

  return {
    enqueue(cb) {
      queue.push(cb);
      current = current.then(process);
    },
    reset() {
      queue.splice(0, queue.length);
    },
  };
}

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

  const { componentName, slotName, stylesheet, partName } = config;

  class PiSlot extends HTMLElement {
    private _empty = false;
    private _ready = false;
    private _queue = createQueue();

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
      this._ready = true;
      this.#start();
    }

    disconnectedCallback() {
      this._ready = false;
      this.#clean();
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
      if (!this._ready) {
        // empty on purpose - just do nothing
      } else if (name === attrTemplateId && newValue !== oldValue) {
        this.#reset();
      } else if (name === attrParams) {
        this.dispatchEvent(new CustomEvent('params-changed', { detail: this.params }));
      } else if (name === attrName && newValue !== oldValue) {
        this.#reset();
      } else if (name === attrFallback && newValue !== oldValue && this._empty) {
        this.#reset();
      }
    }

    #reset() {
      this.#clean();
      this.#start();
    }

    #start() {
      if (this.name) {
        this.#setupChildren();
      }
    }

    #clean() {
      this._queue.reset();
      this.innerHTML = '';
    }

    async #setupChildren() {
      this._queue.enqueue(() => {
        return fragments.load(this.name, this.params);
      });

      this._queue.enqueue((content: string) => {
        const fragment = document.createElement('template');
        const itemTemplate = document.getElementById(this.getAttribute(attrTemplateId) || '');
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
      });
    }

    static get observedAttributes() {
      return [attrName, attrParams, attrGroup, attrTemplateId, attrFallback];
    }
  }

  class PiComponent extends HTMLElement {
    private _lc: ComponentLifecycle | undefined;
    private _locals: any = {};
    private _data: any;
    private _queue = createQueue();
    private _ready = false;
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
      this._ready = true;
      events.on('updated-microfrontends', this.handleUpdate);
      this.#start();
      events.emit('mounted-component', { element: this });
    }

    disconnectedCallback() {
      this._ready = false;
      // just make sure to remove everything
      events.off('updated-microfrontends', this.handleUpdate);
      this.#clean();
      events.emit('unmounted-component', { element: this });
    }

    attributeChangedCallback(name: string, _prev: string, value: string) {
      if (!this._ready) {
        // empty on purpose - just do nothing
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
      this._queue.reset();
      lc?.unmount(this, this._locals);
      this._lc = undefined;
      this._locals = {};
      this.innerHTML = '';
    }

    #start() {
      this.#bootstrap();

      this._queue.enqueue(() => {
        const lc = this._lc;

        if (lc) {
          const data = this._data || tryJson(this.getAttribute(attrData), {});
          lc.mount(this, data, this._locals);
        }
      });
    }

    #reset() {
      this.#clean();
      this.#start();
    }

    #rerender() {
      this._queue.enqueue(() => this._lc?.update(this._data, this._locals));
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

      this._queue.enqueue(() => this._lc?.bootstrap());
    }
  }

  if (stylesheet) {
    const style = document.createElement('style');
    style.textContent = `
      ${slotName} { display: contents; }
      ${componentName} { display: contents; }
      ${partName} { display: contents; }
    `;
    document.head.appendChild(style);
  }

  customElements.define(slotName, PiSlot);
  customElements.define(componentName, PiComponent);

  return {};
}
