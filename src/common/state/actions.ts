import type { StoreApi } from 'zustand/vanilla';
import { createEmptyMicrofrontend } from '@/common/utils/dto';
import type { ComponentLifecycle, ComponentRef, PicardMicrofrontend, PicardState, PicardStore } from '@/types';

function generateUID() {
  const a = (Math.random() * 46656) | 0;
  const b = (Math.random() * 46656) | 0;
  const first = ('000' + a.toString(36)).slice(-3);
  const second = ('000' + b.toString(36)).slice(-3);
  return first + second;
}

function getUrl(source: string) {
  if (typeof location !== 'undefined') {
    const url = new URL(source, location.href);
    return url.href;
  }

  return source;
}

export function registerAsset(store: StoreApi<PicardState>, origin: PicardMicrofrontend, url: string, type: string) {
  const id = generateUID();
  const asset = {
    id,
    url,
    origin: origin.name,
    type,
  };

  store.setState((state) => ({
    assets: {
      ...state.assets,
      [type]: [...(state.assets[type] || []), asset],
    },
  }));

  origin.assets.push(id);
  return asset;
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
    origin: origin.name,
    render,
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

export function retrieveaAsset(store: StoreApi<PicardState>, id: string) {
  if (typeof id === 'string') {
    const { assets } = store.getState();

    for (const list of Object.values(assets)) {
      const asset = list.find((m) => m.id === id);

      if (asset) {
        return asset;
      }
    }
  }

  return undefined;
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
    return createEmptyMicrofrontend(source, kind, source, {
      id: container,
      url: getUrl(source),
    });
  } else if (kind === 'native') {
    return createEmptyMicrofrontend(source, kind, source, {
      url: getUrl(source),
    });
  } else {
    return createEmptyMicrofrontend(source, 'pilet', source, {
      url: getUrl(source),
    });
  }
}
