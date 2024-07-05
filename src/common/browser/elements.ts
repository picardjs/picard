import type { PiComponentProps, PiSlotProps } from '@/types/browser';
import type { ComponentLifecycle, DependencyInjector, UpdatedMicrofrontendsEvent } from '@/types';

const attrName = 'name';
const attrFallbackTemplateId = 'fallback-template-id';
const attrItemTemplateId = 'item-template-id';
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

function createFragment() {
  return document.createDocumentFragment();
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

function getFragment(template: HTMLTemplateElement) {
  if (!template.content?.hasChildNodes()) {
    // this is mostly a workaround for React, where
    // <template> is unfortunately used uincorrectly
    const fragment = createFragment();
    fragment.append(...template.childNodes);
    return fragment;
  }

  return template.content;
}

function fillTemplate(fragment: DocumentFragment, template: HTMLElement, items: Array<any>) {
  if (template instanceof HTMLTemplateElement) {
    const collector = createFragment();
    const templateContent = getFragment(template);
    fragment.childNodes.forEach((node) => {
      const clonedNode = node.cloneNode(true);
      const item = templateContent.cloneNode(true) as DocumentFragment;
      const slot = item.querySelector('slot');
      slot?.replaceWith(clonedNode);
      items.push(clonedNode);
      collector.appendChild(item);
    });
    return collector;
  }

  fragment.childNodes.forEach((node) => items.push(node));
  return fragment;
}

export function createElements(injector: DependencyInjector) {
  const config = injector.get('config');
  const renderer = injector.get('renderer');
  const fragments = injector.get('fragments');
  const events = injector.get('events');
  const sheet = injector.get('sheet');

  const { componentName, slotName } = config;

  class PiSlot extends HTMLElement implements PiSlotProps {
    private _empty = false;
    private _ready = false;
    private _queue = createQueue();
    private _components: Array<PiComponent> = [];

    get name() {
      return this.getAttribute(attrName) || '';
    }

    set name(value: string) {
      this.setAttribute(attrName, value);
    }

    get data() {
      return tryJson(this.getAttribute(attrData), {});
    }

    set data(value: any) {
      this.setAttribute(attrData, JSON.stringify(value));
    }

    async connectedCallback() {
      this._ready = true;
      this.#start();
      events.emit('mounted-slot', { element: this });
    }

    disconnectedCallback() {
      this._ready = false;
      this.#clean();
      events.emit('unmounted-slot', { element: this });
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
      if (!this._ready || oldValue === newValue) {
        // empty on purpose - just do nothing
      } else if (name === attrItemTemplateId) {
        this.#reset();
      } else if (name === attrData) {
        const data = this.data;
        this._components.forEach((m) => m.data = data);
      } else if (name === attrName) {
        this.#reset();
      } else if (name === attrFallbackTemplateId && this._empty) {
        this.#reset();
      }
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

    #reset() {
      this.#clean();
      this.#start();
    }

    async #setupChildren() {
      this._queue.enqueue(() => {
        return fragments.load(this.name, this.data);
      });

      this._queue.enqueue((content: string) => {
        const itemTemplate = document.getElementById(this.getAttribute(attrItemTemplateId) || '');
        this._empty = !!content;
        this.innerHTML = '';
        this._components = [];

        if (content) {
          const fragment = document.createElement('template');
          fragment.innerHTML = content;
          this.appendChild(fillTemplate(getFragment(fragment), itemTemplate, this._components));
        } else {
          const fallbackTemplate = document.getElementById(this.getAttribute(attrFallbackTemplateId) || '');

          if (fallbackTemplate instanceof HTMLTemplateElement) {
            this.appendChild(getFragment(fallbackTemplate).cloneNode(true));
          }
        }
      });
    }

    static get observedAttributes() {
      return [attrName, attrData, attrItemTemplateId, attrFallbackTemplateId];
    }
  }

  class PiComponent extends HTMLElement implements PiComponentProps {
    private _lc: ComponentLifecycle | undefined;
    private _locals: any = {};
    private _queue = createQueue();
    private _ready = false;
    private handleUpdate = (ev: UpdatedMicrofrontendsEvent) => {
      const source = this.getAttribute(attrSource);

      if (source) {
        if (ev.removed.includes(source)) {
          this.#reset();
        } else if (ev.added.includes(source)) {
          this.#reset();
        }
      }
    };

    get name() {
      return this.getAttribute(attrName);
    }

    set name(value: string) {
      this.setAttribute(attrName, value);
    }

    get data() {
      return tryJson(this.getAttribute(attrData), {});
    }

    set data(value: any) {
      this.setAttribute(attrData, JSON.stringify(value));
    }

    connectedCallback() {
      this._ready = true;
      events.on('updated-microfrontends', this.handleUpdate);
      this.#start();
      events.emit('mounted-component', { element: this });
    }

    disconnectedCallback() {
      this._ready = false;
      events.off('updated-microfrontends', this.handleUpdate);
      this.#clean();
      events.emit('unmounted-component', { element: this });
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
      if (!this._ready || newValue === oldValue) {
        // empty on purpose - just do nothing
      } else if (name === attrData) {
        this.#update();
      } else if (name === attrCid || name === attrName || name === attrSource) {
        this.#reset();
      } else if (name === attrFallbackTemplateId && !this._lc) {
        this.#reset();
      }
    }

    static get observedAttributes() {
      return [attrCid, attrData, attrName, attrKind, attrContainer, attrSource, attrFallbackTemplateId];
    }

    #start() {
      this.#bootstrap();

      this._queue.enqueue(() => {
        const lc = this._lc;

        if (lc) {
          lc.mount?.(this, this.data, this._locals);
        } else {
          const fallbackTemplate = document.getElementById(this.getAttribute(attrFallbackTemplateId) || '');

          if (fallbackTemplate instanceof HTMLTemplateElement) {
            this.appendChild(getFragment(fallbackTemplate).cloneNode(true));
          }
        }
      });
    }

    #clean() {
      const lc = this._lc;
      this._queue.reset();
      lc?.unmount?.(this, this._locals);
      this._lc = undefined;
      this._locals = {};
      this.innerHTML = '';
    }

    #reset() {
      this.#clean();
      this.#start();
    }

    #update() {
      this._queue.enqueue(() => this._lc?.update?.(this.data, this._locals));
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

      this._queue.enqueue(() =>
        this._lc?.bootstrap?.().catch(() => {
          this._lc = undefined;
        }),
      );
    }
  }

  if (sheet) {
    const style = document.createElement('style');
    style.textContent = sheet.content;
    document.head.appendChild(style);
  }

  customElements.define(slotName, PiSlot);
  customElements.define(componentName, PiComponent);

  return {};
}
