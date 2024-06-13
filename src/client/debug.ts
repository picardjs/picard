import { DependencyInjector } from '../types';

const selfSource = 'piral-debug-api';
const debugApiVersion = 'v1';
const visualizerName = 'piral-inspector-visualizer';
const piletColorMap = {};
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

function sendMessage(content: any) {
  const message = {
    content,
    source: selfSource,
    version: debugApiVersion,
  };
  window.postMessage(message, '*');
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

interface DebugOptions {
  getApplication(): { name: string; version: string };
  getGlobalState(): any;
  getExtensions(): Array<string>;
  getDependencies(): Array<string>;
  getRoutes(): Array<string>;
  getPilets(): Array<{ name: string; version: string; disabled: boolean; dependencies: Array<string> }>;
  fireEvent(name: string, args: any): void;
  goToRoute(route: string, state: any): void;
  removePilet(name: string): void;
  updatePilet(name: string, disabled: boolean): void;
  addPilet(meta: any): void;
}

function installPiralDebug(options: DebugOptions) {
  const {
    getApplication,
    getGlobalState,
    getExtensions,
    getDependencies,
    getRoutes,
    getPilets,
    fireEvent,
    goToRoute,
    removePilet,
    updatePilet,
    addPilet,
  } = options;
  const events = [];
  const settings = {
    extensionCatalogue: true,
    viewOrigins: true,
  };

  const retrievePilets = () =>
    getPilets().map((pilet) => ({
      name: pilet.name,
      version: pilet.version,
      disabled: pilet.disabled,
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

  const togglePilet = (name: string) => {
    const pilet = getPilets().find((m) => m.name === name);

    if (!pilet) {
      // nothing to do, obviously invalid call
      return;
    }

    const disabled = !pilet.disabled;
    pilet.disabled = disabled;
    updatePilet(name, disabled);

    sendMessage({
      type: 'pilets',
      pilets: retrievePilets(),
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

  const app = getApplication();
  const debugApi = {
    debug: debugApiVersion,
    instance: {
      name: app.name,
      version: app.version,
      dependencies: getDependencies(),
    },
    build: {
      date: '',
      cli: '',
      compat: 'next',
    },
  };

  const details = {
    name: debugApi.instance.name,
    version: debugApi.instance.version,
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
    const container = getGlobalState();
    const routes = getRoutes();
    const extensions = getExtensions();
    const settings = getSettings();
    const dependencies = getDependencies();
    const pilets = retrievePilets();

    sendMessage({
      type: 'available',
      ...details,
      state: {
        routes,
        pilets,
        container,
        settings,
        events,
        extensions,
        dependencies,
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
    const pilets = getPilets();
    const dependencyMap = Object.fromEntries(
      pilets.map((pilet) => [
        pilet.name,
        pilet.dependencies.map((depName) => ({
          demanded: depName,
          resolved: depName,
        })),
      ]),
    );

    sendMessage({
      type: 'dependency-map',
      dependencyMap,
    });
  };

  window.addEventListener('message', (event) => {
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
          return addPilet(content.meta);
        case 'remove-pilet':
          return removePilet(content.name);
        case 'toggle-pilet':
          return togglePilet(content.name);
        case 'emit-event':
          return fireEvent(content.name, content.args);
        case 'goto-route':
          return goToRoute(content.route, content.state);
        case 'visualize-all':
          return toggleVisualize();
      }
    }
  });

  window['dbg:piral'] = debugApi;
  start();
}

export function createDebug(injector: DependencyInjector) {
  const scope = injector.get('scope');
  const events = injector.get('events');
  const config = injector.get('config');
  const router = injector.get('router');

  const { componentName } = config;

  class PiralInspectorVisualizer extends HTMLElement {
    update = () => {
      this.innerText = '';
      document.querySelectorAll(componentName).forEach((element) => {
        const pilet = element.getAttribute('origin') || '';
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
        info.textContent = pilet;
        info.style.position = 'absolute';
        info.style.right = '0';
        info.style.top = '0';
        info.style.fontSize = '8px';
        info.style.background =
          piletColorMap[pilet] || (piletColorMap[pilet] = colors[Object.keys(piletColorMap).length % colors.length]);
      });
    };

    connectedCallback() {
      this.style.position = 'absolute';
      this.style.top = '0';
      this.style.left = '0';
      this.style.width = '0';
      this.style.height = '0';

      window.addEventListener('resize', this.update);
      window.addEventListener('add-component', this.update);
      window.addEventListener('remove-component', this.update);

      this.update();
    }

    disconnectedCallback() {
      window.removeEventListener('resize', this.update);
      window.removeEventListener('add-component', this.update);
      window.removeEventListener('remove-component', this.update);
    }
  }

  customElements.define(visualizerName, PiralInspectorVisualizer);

  installPiralDebug({
    goToRoute(route, state) {
      router.navigate(route, state);
    },
    fireEvent(name, args) {
      return events.emit(name, args);
    },
    getApplication() {
      return {
        name: config.meta?.name || 'App',
        version: config.meta?.version || '0.0.0',
      };
    },
    getDependencies() {
      const state = scope.getState();
      return [];
    },
    getExtensions() {
      const state = scope.getState();
      return [];
    },
    getGlobalState() {
      const state = scope.getState();
      return state;
    },
    getPilets() {
      const state = scope.getState();
      return state.microfrontends.map((m) => ({
        name: m.name,
        version: '0.0.0',
        disabled: false,
        dependencies: [],
      }));
    },
    getRoutes() {
      const state = scope.getState();
      return [];
    },
    addPilet(pilet) {
    //   scope.setState((state) => ({
    //     ...state,
    //     microfrontends: [
    //       ...state.microfrontends,
    //       {
    //         name: pilet.name,
    //         version: pilet.version,
    //         disabled: false,
    //       },
    //     ],
    //   }));
    },
    removePilet(name) {
      scope.setState((state) => ({
        ...state,
        microfrontends: state.microfrontends.filter((m) => m.name !== name),
      }));
    },
    updatePilet(name, disabled) {
      scope.setState((state) => ({
        ...state,
        microfrontends: state.microfrontends.map((m) =>
          m.name === name
            ? {
                ...m,
                disabled,
              }
            : m,
        ),
      }));
    },
  });

  return {};
}
