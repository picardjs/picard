import type { StoreApi } from 'zustand/vanilla';
import { emptyLifecycle } from '../kinds/lifecycle';
import type { ComponentLifecycle, PicardMicrofrontend, PicardState } from '../types';

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
  if (id !== 'void') {
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
