import { getUrl } from '@/common/utils/url';
import { createEmptyMicrofrontend } from '@/common/utils/dto';
import type { StoreApi } from 'zustand/vanilla';
import type {
  AssetDefinition,
  ComponentDefinition,
  ComponentRef,
  PicardAsset,
  PicardComponent,
  PicardMicrofrontend,
  PicardState,
  PicardStore,
} from '@/types';

function generateUID(): string {
  const a = (Math.random() * 46656) | 0;
  const b = (Math.random() * 46656) | 0;
  const first = ('000' + a.toString(36)).slice(-3);
  const second = ('000' + b.toString(36)).slice(-3);
  return first + second;
}

export function registerAsset(
  store: StoreApi<PicardState>,
  mf: PicardMicrofrontend,
  definition: AssetDefinition,
): PicardAsset {
  const id = generateUID();
  const { url, type } = definition;
  const asset = {
    id,
    url,
    origin: mf.name,
    type,
  };

  store.setState((state) => ({
    assets: {
      ...state.assets,
      [type]: [...(state.assets[type] || []), asset],
    },
  }));

  mf.assets.push(id);
  return asset;
}

export function registerComponent(
  store: StoreApi<PicardState>,
  mf: PicardMicrofrontend,
  definition: ComponentDefinition,
): PicardComponent {
  const id = generateUID();
  const { name, meta, type } = definition;
  const component = {
    id,
    name,
    meta,
    type,
    origin: mf.name,
  };

  store.setState((state) => ({
    components: {
      ...state.components,
      [name]: [...(state.components[name] || []), component],
    },
  }));

  mf.components.push(id);
  return component;
}

export function findComponent(store: StoreApi<PicardState>, name: string, origin: string): PicardComponent | undefined {
  const components = store.getState().components[name] || [];
  return components.find((m) => m.origin === origin);
}

export function findMicrofrontend(scope: PicardStore, origin: string): PicardMicrofrontend | undefined {
  return scope.readState().microfrontends.find((m) => m.name === origin);
}

export function retrieveaAsset(store: StoreApi<PicardState>, id: string): PicardAsset | undefined {
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

export function retrieveComponent(store: StoreApi<PicardState>, id: string): PicardComponent | undefined {
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

export function createMicrofrontend(ref: ComponentRef): PicardMicrofrontend {
  const { source, format } = ref;

  if (format === 'module') {
    const { remoteName, remoteType = 'var' } = ref;
    return createEmptyMicrofrontend(source, format, source, {
      id: remoteName,
      type: remoteType,
      url: getUrl(source),
    });
  } else if (format === 'native') {
    return createEmptyMicrofrontend(source, format, source, {
      url: getUrl(source),
    });
  } else if (format === 'pilet') {
    return createEmptyMicrofrontend(source, format, source, {
      url: getUrl(source),
    });
  } else {
    return undefined;
  }
}
