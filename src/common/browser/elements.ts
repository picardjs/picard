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
const attrClient = 'client';
const attrHydrate = 'hydrate';
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
    if (!element.hasChildNodes()) {
      const loadingTemplateId = element.getAttribute(attrLoadingTemplateId) || '';
      const loadingTemplate = loadingTemplateId && document.getElementById(loadingTemplateId);

      if (loadingTemplate instanceof HTMLTemplateElement) {
        element.appendChild(getFragment(loadingTemplate).cloneNode(true));
      }
    }
  });

  return () => cancelAnimationFrame(frameIndex);
}

function serializeData(value: any) {
  // frameworks such as Svelte or Vue set the property with the (serialized) value of the attribute
  return typeof value === 'string' ? value : JSON.stringify(value);
}

function fallback(element: HTMLElement) {
  const fallbackTemplateId = element.getAttribute(attrFallbackTemplateId) || '';
  const fallbackTemplate = fallbackTemplateId && document.getElementById(fallbackTemplateId);

  if (fallbackTemplate instanceof HTMLTemplateElement) {
    element.appendChild(getFragment(fallbackTemplate).cloneNode(true));
  }
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
    private _stopLoader: (() => void) | undefined;

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
      this.setAttribute(attrData, serializeData(value));
    }

    async connectedCallback() {
      if (this._ready) {
        // only moved (e.g., by streamed rendering) - keep the content
        return;
      }

      this._ready = true;
      this.#start();
      events.emit('mounted-slot', { element: this });
    }

    disconnectedCallback() {
      // a moved element is reconnected in the same task, so only clean up if it stays disconnected
      queueMicrotask(() => {
        if (this._ready && !this.isConnected) {
          this._ready = false;
          this.#clean();
          events.emit('unmounted-slot', { element: this });
        }
      });
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
      if (!this.name) {
        // nothing to do without a name
      } else if (!this.hasChildNodes()) {
        this.#setupChildren();
      } else {
        // resumed from the server; the children are already rendered
        this._components = Array.from(this.querySelectorAll<PiComponent>(componentName)).filter(
          (component) => component.parentElement?.closest(slotName) === this,
        );
      }
    }

    #clean() {
      this._stopLoader?.();
      this._stopLoader = undefined;
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
      const stopLoader = (this._stopLoader = loader(this));

      this._queue.enqueue(() => {
        const orderBy = this.getAttribute(attrOrderBy);
        const reverse = this.getAttribute(attrReverseOrder) !== null;
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
        this._stopLoader = undefined;

        if (content) {
          const fragment = document.createElement('template');
          fragment.innerHTML = content;
          this.appendChild(fillTemplate(getFragment(fragment), itemTemplate, this._components));
        } else {
          fallback(this);
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
    private _stopStart: (() => void) | undefined;
    private _stopLoader: (() => void) | undefined;
    private _startGeneration = 0;
    private handleUpdate = (ev: UpdatedMicrofrontendsEvent) => {
      const source = this.getAttribute(attrSource);

      if (source) {
        const client = this.getAttribute(attrClient);

        if (client === 'none') {
          // Skip update as we don't want to render on the client
        } else if (ev.removed.includes(source) && this._lc) {
          this.#reset();
        } else if (ev.added.includes(source) && !this._lc) {
          this.#reset();
        }
      }
    };

    get data() {
      return tryJson(this.getAttribute(attrData), {});
    }

    set data(value: any) {
      this.setAttribute(attrData, serializeData(value));
    }

    connectedCallback() {
      if (this._ready) {
        // only moved (e.g., by streamed rendering) - keep the (server-rendered) content
        return;
      }

      this._ready = true;
      events.on('updated-microfrontends', this.handleUpdate);
      this.#start();
      events.emit('mounted-component', { element: this });
    }

    disconnectedCallback() {
      // a moved element is reconnected in the same task, so only clean up if it stays disconnected
      queueMicrotask(() => {
        if (this._ready && !this.isConnected) {
          this._ready = false;
          events.off('updated-microfrontends', this.handleUpdate);
          this.#clean();
          events.emit('unmounted-component', { element: this });
        }
      });
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
      this._stopStart?.();
      this._stopStart = undefined;
      const generation = ++this._startGeneration;

      const client = this.getAttribute(attrClient);

      switch (client) {
        case 'none':
          return;
        case 'idle': {
          const idleCallback = requestIdleCallback(() => {
            if (generation === this._startGeneration) {
              this._stopStart = undefined;

              if (this._ready) {
                this.#setupContent();
              }
            }
          });
          this._stopStart = () => cancelIdleCallback(idleCallback);
          return;
        }
        case 'visible':
          // the element itself has no box; observe its (server-rendered) children to avoid layout changes
          const targets = Array.from(this.children);

          if (!targets.length) {
            this.style.display = 'block';
            targets.push(this);
          }

          const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                if (!this._ready || generation !== this._startGeneration) {
                  observer.disconnect();
                  return;
                }

                if (targets[0] === this) {
                  this.style.display = 'contents';
                }

                observer.disconnect();

                if (this._stopStart) {
                  this._stopStart = undefined;
                }

                if (this._ready) {
                  this.#setupContent();
                }
              }
            });
          });

          targets.forEach((target) => observer.observe(target));
          this._stopStart = () => observer.disconnect();
          return;
        case 'load':
        default:
          return this.#setupContent();
      }
    }

    #setupContent() {
      const stopLoader = (this._stopLoader = loader(this));
      this.#bootstrap();

      this._queue.enqueue(() => {
        const lc = this._lc;
        // the server marks components with markup that can be hydrated
        const hydrate = this.hasAttribute(attrHydrate);

        stopLoader();
        this._stopLoader = undefined;

        if (lc) {
          this._locals.hydrate = hydrate;
          lc.mount?.(this, this.data, this._locals);
        } else if (!hydrate) {
          fallback(this);
        }
      });
    }

    #clean() {
      const lc = this._lc;
      this._startGeneration++;
      this._stopStart?.();
      this._stopStart = undefined;
      this._stopLoader?.();
      this._stopLoader = undefined;
      this._queue.reset();
      lc?.unmount?.(this, this._locals);
      this._lc = undefined;
      this._locals = {};
      this.innerHTML = '';
      this.removeAttribute(attrHydrate);
    }

    #reset() {
      this.#clean();
      this.#start();
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

      const assets = await scope.loadAssets('css');

      appendSheets(
        added.flatMap((name) => assets.filter((m) => m.origin === name).map(makeSheet)),
        style,
      );
    });
  }

  customElements.define(slotName, PiSlot);
  customElements.define(componentName, PiComponent);

  return {};
}
