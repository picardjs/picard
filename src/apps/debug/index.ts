import { decycle } from './decycle';
import { attachVisualizer } from './visualizer';
import type { Configuration, EventSystem, Listener, PicardEventMap, PicardStore, RouterService } from '@/types';

const selfSource = 'piral-debug-api';
const debugApiVersion = 'v1';

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

interface EventItem {
  id: string;
  name: string;
  args: any;
  time: number;
}

type Dependencies = Array<{ demanded: string; resolved: string }>;

type DependencyMap = Record<string, Dependencies>;

function attach<TEvent extends keyof PicardEventMap>(
  events: EventSystem,
  name: TEvent & string,
  handler: Listener<PicardEventMap[TEvent]>,
) {
  events.on(name, handler);
  return () => {
    events.off(name, handler);
  };
}

interface DebugAdapterOptions {
  scope: PicardStore;
  events: EventSystem;
  config: Configuration;
  router: RouterService;
}

export function initializeDebugAdapter({ config, events, router, scope }: DebugAdapterOptions) {
  const { componentName } = config;

  const eventList: Array<EventItem> = [];
  const depMap: Record<string, Record<string, string>> = {};
  const subDeps: Record<string, string> = {};

  const visualizer = attachVisualizer(scope, events, componentName);

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

  const getMicrofrontends = () => {
    const state = scope.readState();
    return state.microfrontends.map((m) => ({
      name: m.name,
      version: '0.0.0',
      root: m.source,
      url: m.source,
      disabled: false,
    }));
  };

  const getDependencies = () => {
    const result: DependencyMap = {};

    const mfs = getMicrofrontends()
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
  };

  const addMicrofrontend = (meta) => {
    scope.appendMicrofrontend({
      name: meta.name,
      kind: 'pilet',
      components: {},
      assets: [],
      details: {
        ...meta,
      },
      source: meta.name,
    });
  };

  const updateMicrofrontend = (name: string, disabled: boolean) => {
    scope.updateMicrofrontend(name, { disabled });
  };

  const getSlotNames = () => {
    const state = scope.readState();
    return Object.keys(state.components);
  };

  const unsubscribe = scope.subscribe((current, previous) => {
    sendMessage({
      type: 'container',
      container: scope.readState(),
    });

    if (current.microfrontends !== previous.microfrontends) {
      sendMessage({
        type: 'pilets',
        pilets: getMicrofrontends().map((mf) => ({
          name: mf.name,
          version: '0.0.0',
          disabled: !!mf.disabled,
        })),
      });
    }

    if (current.components !== previous.components) {
      sendMessage({
        type: 'routes',
        routes: router.findRoutes(),
      });

      sendMessage({
        type: 'extensions',
        extensions: getSlotNames(),
      });
    }
  });

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

  const app = {
    name: config.meta?.name || document.querySelector('meta[name=app-name]')?.getAttribute('content') || document.title,
    version: config.meta?.version || document.querySelector('meta[name=app-version]')?.getAttribute('content') || '-',
  };

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
        routes: router.findRoutes(),
        pilets: retrieveMicrofrontends(),
        container: scope.readState(),
        settings: getSettings(),
        events: eventList,
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

  return {
    forward(content: any) {
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
          return scope.removeMicrofrontend(content.name);
        case 'toggle-pilet':
          return toggleMicrofrontend(content.name);
        case 'emit-event':
          return events.emit(content.name, content.args);
        case 'goto-route':
          return router.navigate(content.route, content.state);
        case 'visualize-all':
          return visualizer.toggle();
      }
    },
    dispose() {
      detachResolved();
      detachAll();
      unsubscribe();
    },
  };
}
