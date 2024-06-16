import { decycle } from './decycle';
import type { DependencyInjector, EventEmitter, Listener, PicardEventMap } from '../types';

const selfSource = 'piral-debug-api';
const debugApiVersion = 'v1';
const visualizerName = 'piral-inspector-visualizer';
const colors = [
  '#001F3F',
  '#0074D9',
  '#7FDBFF',
  '#39CCCC',
  '#3D9970',
  '#2ECC40',
  '#01FF70',
  '#FFDC00',
  '#FF851B',
  '#FF4136',
  '#85144B',
  '#F012BE',
  '#B10DC9',
];

function sendMessage(data: any) {
  const message = {
    content: decycle(data),
    source: selfSource,
    version: debugApiVersion,
  };
  window.postMessage(message, '*');
}

function findAncestor(parent: string, subDeps: Record<string, string>) {
  while (subDeps[parent]) {
    parent = subDeps[parent];
  }

  return parent;
}

function getTarget(element: Element) {
  const row = element.childNodes;
  return [...row]
    .map((item) => {
      if (item instanceof Element) {
        return item.getBoundingClientRect();
      } else if (item instanceof Text) {
        const range = document.createRange();
        range.selectNode(item);
        return range.getBoundingClientRect();
      } else {
        return new DOMRectReadOnly(0, 0, 0, 0);
      }
    })
    .filter((m) => m.height !== 0 && m.width !== 0)
    .reduce((a, b) => {
      const x = Math.min(a.left, b.left);
      const y = Math.min(a.top, b.top);
      const width = Math.max(a.right, b.right) - x;
      const height = Math.max(a.bottom, b.bottom) - y;
      return new DOMRectReadOnly(x, y, width, height);
    });
}

interface EventItem {
  id: string;
  name: string;
  args: any;
  time: number;
}

type Dependencies = Array<{ demanded: string; resolved: string }>;

type DependencyMap = Record<string, Dependencies>;

interface DebugOptions {
  getAppInfo(): { name: string; version: string };
  getScopeState(): any;
  getSlotNames(): Array<string>;
  getDependencies(): DependencyMap;
  getEvents(): Array<EventItem>;
  getRoutes(): Array<string>;
  getMicrofrontends(): Array<{ name: string; url: string; root: string; disabled: boolean }>;
  fireEvent(name: string, args: any): void;
  goToRoute(route: string, state: any): void;
  removeMicrofrontend(name: string): void;
  updateMicrofrontend(name: string, disabled: boolean): void;
  addMicrofrontend(meta: any): void;
}

function install(options: DebugOptions) {
  const {
    getAppInfo,
    getScopeState,
    getSlotNames,
    getDependencies,
    getRoutes,
    getMicrofrontends,
    getEvents,
    fireEvent,
    goToRoute,
    removeMicrofrontend,
    updateMicrofrontend,
    addMicrofrontend,
  } = options;
  const settings = {
    extensionCatalogue: true,
    viewOrigins: true,
  };

  const retrieveMicrofrontends = () =>
    getMicrofrontends().map((mf) => ({
      name: mf.name,
      version: '0.0.0',
      disabled: mf.disabled,
    }));

  const inspectorSettings = {
    viewOrigins: {
      value: settings.viewOrigins,
      type: 'boolean',
      label: 'Visualize component origins',
      onChange(value: boolean) {
        settings.viewOrigins = value;
      },
    },
    extensionCatalogue: {
      value: settings.extensionCatalogue,
      type: 'boolean',
      label: 'Enable extension catalogue',
      onChange(value: boolean) {
        settings.extensionCatalogue = value;
      },
    },
  };

  const getSettings = () => {
    return Object.keys(inspectorSettings).reduce((obj, key) => {
      const setting = inspectorSettings[key];

      if (
        setting &&
        typeof setting === 'object' &&
        typeof setting.label === 'string' &&
        typeof setting.type === 'string' &&
        ['boolean', 'string', 'number'].includes(typeof setting.value)
      ) {
        obj[key] = {
          label: setting.label,
          value: setting.value,
          type: setting.type,
        };
      }

      return obj;
    }, {});
  };

  const updateSettings = (values: Record<string, any>) => {
    Object.keys(values).forEach((name) => {
      const setting = inspectorSettings[name];

      switch (setting.type) {
        case 'boolean': {
          const prev = setting.value;
          const value = values[name];
          setting.value = value;
          setting.onChange(value, prev);
          break;
        }
        case 'number': {
          const prev = setting.value;
          const value = values[name];
          setting.value = value;
          setting.onChange(value, prev);
          break;
        }
        case 'string': {
          const prev = setting.value;
          const value = values[name];
          setting.value = value;
          setting.onChange(value, prev);
          break;
        }
      }
    });

    sendMessage({
      settings: getSettings(),
      type: 'settings',
    });
  };

  const toggleMicrofrontend = (name: string) => {
    const mf = getMicrofrontends().find((m) => m.name === name);

    if (!mf) {
      // nothing to do, obviously invalid call
      return;
    }

    const disabled = !mf.disabled;
    mf.disabled = disabled;
    updateMicrofrontend(name, disabled);

    sendMessage({
      type: 'pilets',
      pilets: retrieveMicrofrontends(),
    });
  };

  const toggleVisualize = () => {
    const visualizer = document.querySelector(visualizerName);

    if (visualizer) {
      visualizer.remove();
    } else {
      document.body.appendChild(document.createElement(visualizerName));
    }
  };

  const app = getAppInfo();

  const details = {
    name: app.name,
    version: app.version,
    kind: debugApiVersion,
    mode: 'development',
    capabilities: [
      'events',
      'container',
      'routes',
      'pilets',
      'settings',
      'extensions',
      'dependencies',
      'dependency-map',
    ],
  };

  const start = () => {
    sendMessage({
      type: 'available',
      ...details,
      state: {
        routes: getRoutes(),
        pilets: retrieveMicrofrontends(),
        container: getScopeState(),
        settings: getSettings(),
        events: getEvents(),
        extensions: getSlotNames(),
        dependencies: [],
      },
    });
  };

  const check = () => {
    sendMessage({
      type: 'info',
      ...details,
    });
  };

  const getDependencyMap = () => {
    const dependencyMap = getDependencies();

    sendMessage({
      type: 'dependency-map',
      dependencyMap,
    });
  };

  const handler = (event: MessageEvent) => {
    const { source, version, content } = event.data;

    if (source !== selfSource && version === debugApiVersion) {
      switch (content.type) {
        case 'init':
          return start();
        case 'check-piral':
          return check();
        case 'get-dependency-map':
          return getDependencyMap();
        case 'update-settings':
          return updateSettings(content.settings);
        case 'append-pilet':
          return addMicrofrontend(content.meta);
        case 'remove-pilet':
          return removeMicrofrontend(content.name);
        case 'toggle-pilet':
          return toggleMicrofrontend(content.name);
        case 'emit-event':
          return fireEvent(content.name, content.args);
        case 'goto-route':
          return goToRoute(content.route, content.state);
        case 'visualize-all':
          return toggleVisualize();
      }
    }
  };

  window.addEventListener('message', handler);

  start();

  return () => {
    window.removeEventListener('message', handler);
  };
}

function attach<TEvent extends keyof PicardEventMap>(
  events: EventEmitter,
  name: TEvent,
  handler: Listener<PicardEventMap[TEvent]>,
) {
  events.on(name, handler);
  return () => {
    events.off(name, handler);
  };
}

export function createDebug(injector: DependencyInjector) {
  const scope = injector.get('scope');
  const events = injector.get('events');
  const config = injector.get('config');
  const router = injector.get('router');

  const { componentName } = config;

  const eventList: Array<EventItem> = [];
  const depMap: Record<string, Record<string, string>> = {};
  const subDeps: Record<string, string> = {};
  const mfColorMap: Record<string, string> = {};

  const getMicrofrontend = (element: Element) => {
    const origin = element.getAttribute('origin');

    if (origin) {
      return origin;
    }

    const cid = element.getAttribute('cid');

    if (cid) {
      const state = scope.readState();
      const mf = state.microfrontends.find((m) => cid in m.components);
      return mf?.name || '';
    }

    const source = element.getAttribute('source');

    if (source) {
      const state = scope.readState();
      const mf = state.microfrontends.find((m) => m.source === source);
      return mf?.name || '';
    }

    return '';
  };

  const addDeps = (result: DependencyMap, name: string, dependencies: Record<string, string>) => {
    const deps = result[name] || [];

    for (const depName of Object.keys(dependencies)) {
      if (!deps.some((m) => m.demanded === depName)) {
        deps.push({
          demanded: depName,
          resolved: dependencies[depName],
        });
      }
    }

    result[name] = deps;
  };

  const detachResolved = attach(events, 'resolved-dependency', ({ id, parentUrl, result }) => {
    if (parentUrl) {
      const ancestor = findAncestor(parentUrl, subDeps);

      if (id.startsWith('./')) {
        subDeps[result] = ancestor;
      } else {
        const deps = depMap[ancestor] || {};
        deps[id] = result;
        depMap[ancestor] = deps;
      }
    }
  });

  const detachAll = attach(events, '*', (ev) => {
    eventList.unshift({
      id: eventList.length.toString(),
      name: ev.name,
      args: decycle(ev.args),
      time: Date.now(),
    });

    sendMessage({
      events: eventList,
      type: 'events',
    });
  });

  class PiralInspectorVisualizer extends HTMLElement {
    update = () => {
      this.innerText = '';
      document.querySelectorAll(componentName).forEach((element) => {
        const mf = getMicrofrontend(element);
        const vis = this.appendChild(document.createElement('div'));
        const info = vis.appendChild(document.createElement('div'));
        const targetRect = getTarget(element);
        vis.style.position = 'absolute';
        vis.style.left = targetRect.left + 'px';
        vis.style.top = targetRect.top + 'px';
        vis.style.width = targetRect.width + 'px';
        vis.style.height = targetRect.height + 'px';
        vis.style.pointerEvents = 'none';
        vis.style.zIndex = '99999999999';
        vis.style.border = '1px solid #ccc';
        info.style.color = 'white';
        info.textContent = mf;
        info.style.position = 'absolute';
        info.style.right = '0';
        info.style.top = '0';
        info.style.fontSize = '8px';
        info.style.background =
          mfColorMap[mf] || (mfColorMap[mf] = colors[Object.keys(mfColorMap).length % colors.length]);
      });
    };

    connectedCallback() {
      this.style.position = 'absolute';
      this.style.top = '0';
      this.style.left = '0';
      this.style.width = '0';
      this.style.height = '0';

      window.addEventListener('resize', this.update);
      events.on('mounted-component', this.update);
      events.on('unmounted-component', this.update);
      this.update();
    }

    disconnectedCallback() {
      window.removeEventListener('resize', this.update);
      events.off('mounted-component', this.update);
      events.off('unmounted-component', this.update);
    }
  }

  customElements.define(visualizerName, PiralInspectorVisualizer);

  const options: DebugOptions = {
    goToRoute(route, state) {
      router.navigate(route, state);
    },
    fireEvent(name, args) {
      events.emit(name, args);
    },
    getAppInfo() {
      return {
        name:
          config.meta?.name || document.querySelector('meta[name=app-name]')?.getAttribute('content') || document.title,
        version:
          config.meta?.version || document.querySelector('meta[name=app-version]')?.getAttribute('content') || '-',
      };
    },
    getDependencies() {
      const result: DependencyMap = {};

      const mfs = options
        .getMicrofrontends()
        .map((mf) => ({
          name: mf.name,
          link: mf.url,
          base: mf.root,
        }))
        .filter((m) => m.link);

      Object.keys(depMap).forEach((url) => {
        const dependencies = depMap[url];
        const mf = mfs.find((p) => p.link === url);

        if (mf) {
          addDeps(result, mf.name, dependencies);
        } else if (!mf) {
          const parent = mfs.find((p) => url.startsWith(p.base));

          if (parent) {
            addDeps(result, parent.name, dependencies);
          }
        }
      });

      return result;
    },
    getSlotNames() {
      const state = scope.readState();
      return Object.keys(state.components);
    },
    getScopeState() {
      return scope.readState();
    },
    getMicrofrontends() {
      const state = scope.readState();
      return state.microfrontends.map((m) => ({
        name: m.name,
        version: '0.0.0',
        root: m.source,
        url: m.source,
        disabled: false,
      }));
    },
    getRoutes() {
      return router.findRoutes();
    },
    addMicrofrontend(meta) {
      scope.appendMicrofrontend({
        name: meta.name,
        kind: 'pilet',
        components: {},
        details: {
          ...meta,
        },
        source: meta.name,
      });
    },
    removeMicrofrontend(name) {
      scope.removeMicrofrontend(name);
    },
    updateMicrofrontend(name, disabled) {
      scope.updateMicrofrontend(name, { disabled });
    },
    getEvents() {
      return eventList;
    },
  };

  const unsubscribe = scope.subscribe((current, previous) => {
    sendMessage({
      type: 'container',
      container: options.getScopeState(),
    });

    if (current.microfrontends !== previous.microfrontends) {
      sendMessage({
        type: 'pilets',
        pilets: options.getMicrofrontends().map((mf) => ({
          name: mf.name,
          version: '0.0.0',
          disabled: !!mf.disabled,
        })),
      });
    }

    if (current.components !== previous.components) {
      sendMessage({
        type: 'routes',
        routes: options.getRoutes(),
      });

      sendMessage({
        type: 'extensions',
        extensions: options.getSlotNames(),
      });
    }
  });

  const uninstall = install(options);

  return {
    dispose() {
      detachResolved();
      detachAll();
      unsubscribe();
      uninstall();
    },
  };
}
