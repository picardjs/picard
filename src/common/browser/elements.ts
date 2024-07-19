import { tryJson } from '@/common/utils/json';
import type { PiComponentProps, PiSlotProps } from '@/types/browser';
import type { ComponentLifecycle, DependencyInjector, PicardAsset, UpdatedMicrofrontendsEvent } from '@/types';

const attrName = 'name';
const attrFallbackTemplateId = 'fallback-template-id';
const attrItemTemplateId = 'item-template-id';
const attrLoadingTemplateId = 'loading-template-id';
const attrOrderBy = 'order-by';
const attrReverseOrder = 'reverse-order';
const attrRemoteName = 'remote-name';
const attrRemoteType = 'remote-type';
const attrSource = 'source';
const attrFormat = 'format';
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

function makeSheet(asset: PicardAsset) {
  const node = document.createElement('link');
  node.href = asset.url;
  node.rel = 'stylesheet';
  node.dataset.origin = asset.origin;
  return node;
}

function appendSheets(sheets: Array<HTMLLinkElement>, node: Node) {
  if (sheets.length > 0) {
    const frag = createFragment();
    frag.append(...sheets);
    document.head.insertBefore(frag, node);
  }
}

function createFragment() {
  return document.createDocumentFragment();
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

function loader(element: HTMLElement) {
  const frameIndex = requestAnimationFrame(() => {
    const loadingTemplateId = element.getAttribute(attrLoadingTemplateId) || '';
    const loadingTemplate = loadingTemplateId && document.getElementById(loadingTemplateId);

    if (loadingTemplate instanceof HTMLTemplateElement) {
      element.innerHTML = '';
      element.appendChild(getFragment(loadingTemplate).cloneNode(true));
    }
  });

  return () => cancelAnimationFrame(frameIndex);
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
        this._components.forEach((m) => (m.data = data));
      } else if (name === attrName) {
        this.#reset();
      } else if (name === attrFallbackTemplateId && this._empty) {
        this.#reset();
      } else if (name === attrReverseOrder) {
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

    #details(): [string, any] {
      const rel = this.getAttribute('rel');
      const service = rel && injector.get(`slotRel.${rel}`);

      if (!service) {
        return [this.name, this.data];
      }

      return service.apply(Object.fromEntries(this.getAttributeNames().map((name) => [name, this.getAttribute(name)])));
    }

    async #setupChildren() {
      const stopLoader = loader(this);

      this._queue.enqueue(() => {
        const orderBy = this.getAttribute(attrOrderBy);
        const reverse = !!this.getAttribute(attrReverseOrder);
        const [name, data] = this.#details();
        return fragments.load(name, data, { orderBy, reverse });
      });

      this._queue.enqueue((content: string) => {
        const itemTemplateId = this.getAttribute(attrItemTemplateId) || '';
        const itemTemplate = itemTemplateId && document.getElementById(itemTemplateId);
        this._empty = !!content;
        this.innerHTML = '';
        this._components = [];

        stopLoader();

        if (content) {
          const fragment = document.createElement('template');
          fragment.innerHTML = content;
          this.appendChild(fillTemplate(getFragment(fragment), itemTemplate, this._components));
        } else {
          const fallbackTemplateId = this.getAttribute(attrFallbackTemplateId) || '';
          const fallbackTemplate = fallbackTemplateId && document.getElementById(fallbackTemplateId);

          if (fallbackTemplate instanceof HTMLTemplateElement) {
            this.appendChild(getFragment(fallbackTemplate).cloneNode(true));
          }
        }

        const loading = this.getAttribute(attrLoadingTemplateId);

        if (loading) {
          this._components.forEach((c) => c.setAttribute(attrLoadingTemplateId, loading));
        }
      });
    }

    static get observedAttributes() {
      return [attrName, attrData, attrItemTemplateId, attrFallbackTemplateId, attrReverseOrder];
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
      return [
        attrCid,
        attrData,
        attrName,
        attrFormat,
        attrSource,
        attrFallbackTemplateId,
        attrRemoteName,
        attrRemoteType,
      ];
    }

    #start() {
      const stopLoader = loader(this);
      this.#bootstrap();

      this._queue.enqueue(() => {
        const lc = this._lc;

        stopLoader();

        if (lc) {
          lc.mount?.(this, this.data, this._locals);
        } else {
          const fallbackTemplateId = this.getAttribute(attrFallbackTemplateId) || '';
          const fallbackTemplate = fallbackTemplateId && document.getElementById(fallbackTemplateId);

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

    #loading() {
      const loadingTemplateId = this.getAttribute(attrLoadingTemplateId) || '';
      const loadingTemplate = loadingTemplateId && document.getElementById(loadingTemplateId);

      if (loadingTemplate instanceof HTMLTemplateElement) {
        this.innerHTML = '';
        this.appendChild(getFragment(loadingTemplate).cloneNode(true));
      }
    }

    #update() {
      this._queue.enqueue(() => {
        const data = this.getAttribute(attrData);
        const current = this.data;
        this._lc?.update?.(current, this._locals);
        events.emit('changed-data', { current, data });
      });
    }

    #bootstrap() {
      const cid = this.getAttribute(attrCid);
      const name = this.getAttribute(attrName);
      const framework = this.getAttribute(attrFramework) || undefined;
      const opts = { framework };

      if (cid) {
        this._lc = renderer.render({ cid }, opts);
      } else if (name) {
        const source = this.getAttribute(attrSource);
        const remoteName = this.getAttribute(attrRemoteName);
        const remoteType = this.getAttribute(attrRemoteType) as 'esm' | 'var';
        const format = this.getAttribute(attrFormat);
        this._lc = renderer.render({ name, source, remoteName, remoteType, format }, opts);
      }

      this._queue.enqueue(() =>
        this._lc?.load?.().catch(() => {
          this._lc = undefined;
        }),
      );
    }
  }

  if (sheet) {
    const scope = injector.get('scope');
    const style = document.createElement('style');
    const { assets } = scope.readState();
    style.textContent = sheet.content;
    appendSheets((assets.css || []).map(makeSheet), document.head.appendChild(style));

    events.on('updated-microfrontends', async ({ added, removed }) => {
      removed.forEach((name) => {
        const sheets = document.querySelectorAll(`link[data-origin="${name}"]`);
        sheets.forEach((node) => node.remove());
      });

      const ids = await scope.loadAssets('css');

      appendSheets(
        added.flatMap((name) =>
          ids
            .map((id) => scope.retrieveAsset(id))
            .filter((m) => m.origin === name)
            .map(makeSheet),
        ),
        style,
      );
    });
  }

  customElements.define(slotName, PiSlot);
  customElements.define(componentName, PiComponent);

  return {};
}
