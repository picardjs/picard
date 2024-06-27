import type { StoreApi } from 'zustand/vanilla';
import { emptyLifecycle } from '@/common/kinds/lifecycle';
import type { ComponentLifecycle, ComponentRef, PicardMicrofrontend, PicardState, PicardStore } from '@/types';

function generateUID() {
  const a = (Math.random() * 46656) | 0;
  const b = (Math.random() * 46656) | 0;
  const first = ('000' + a.toString(36)).slice(-3);
  const second = ('000' + b.toString(36)).slice(-3);
  return first + second;
}

export function registerComponent(
  store: StoreApi<PicardState>,
  origin: PicardMicrofrontend,
  name: string,
  render: ComponentLifecycle,
) {
  const id = generateUID();
  const component = {
    id,
    name,
    origin,
    render: {
      ...emptyLifecycle,
      ...render,
    },
  };

  store.setState((state) => ({
    components: {
      ...state.components,
      [name]: [...(state.components[name] || []), component],
    },
  }));

  origin.components[name] = id;
  return component;
}

export function retrieveComponent(store: StoreApi<PicardState>, id: string) {
  if (typeof id === 'string') {
    const { components } = store.getState();

    for (const list of Object.values(components)) {
      const component = list.find((m) => m.id === id);

      if (component) {
        return component;
      }
    }
  }

  return undefined;
}

export function findMicrofrontend(scope: PicardStore, component: ComponentRef) {
  const source = component.source;
  return scope.readState().microfrontends.find((m) => m.name === source);
}

export function getExistingLifecycle(scope: PicardStore, component: ComponentRef) {
  const mf = findMicrofrontend(scope, component);
  const id = mf?.components[component.name];

  if (id) {
    return scope.retrieveLifecycle(id);
  }

  return undefined;
}

export function createMicrofrontend(component: ComponentRef): PicardMicrofrontend {
  const { source, kind, container } = component;

  if (kind === 'module') {
    return {
      kind,
      name: source,
      details: {
        id: container,
        url: source,
      },
      source,
      components: {},
    };
  } else if (kind === 'native') {
    return {
      kind,
      name: source,
      details: {
        url: source,
      },
      source,
      components: {},
    };
  } else {
    return {
      kind: 'pilet',
      name: source,
      details: {
        url: source,
      },
      source,
      components: {},
    };
  }
}
