import { emptyLifecycle } from '../kinds/lifecycle';
import { ComponentLifecycle, PicardMicrofrontend, PicardStore } from '../types';

function generateUID() {
  const a = (Math.random() * 46656) | 0;
  const b = (Math.random() * 46656) | 0;
  const first = ('000' + a.toString(36)).slice(-3);
  const second = ('000' + b.toString(36)).slice(-3);
  return first + second;
}

export function registerComponent(
  scope: PicardStore,
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

  scope.setState((state) => ({
    components: {
      ...state.components,
      [name]: [...(state.components[name] || []), component],
    },
  }));

  origin.components[name] = id;
  return component;
}

export function updateDetails<T extends PicardMicrofrontend>(scope: PicardStore, mf: T, details: T['details']) {
  scope.setState((state) => ({
    microfrontends: state.microfrontends.map((item) =>
      item === mf
        ? {
            ...mf,
            details: {
              ...mf.details,
              ...details,
            },
          }
        : item,
    ),
  }));
}

export function retrieveComponent(scope: PicardStore, id: string) {
  if (id !== 'void') {
    const { components } = scope.getState();

    for (const list of Object.values(components)) {
      const component = list.find((m) => m.id === id);

      if (component) {
        return component;
      }
    }
  }

  return undefined;
}
