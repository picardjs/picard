import { emptyLifecycle } from '@/common/utils/lifecycle';
import type { ConverterService } from '@/types';

interface WebComponentConstructor {
  new (): Element;
}

function getValue(value: any) {
  switch (typeof value) {
    case 'object':
      return JSON.stringify(value);
    case 'function':
      return '';
    case 'undefined':
      return null;
    default:
      return value.toString();
  }
}

function updateAttributes(element: Element, props: any) {
  Object.entries(props).forEach(([key, value]) => {
    element.setAttribute(key, getValue(value));
  });
}

export function createWebComponentConverter(): ConverterService {
  return {
    convert(ComponentClass: string | WebComponentConstructor) {
      return {
        ...emptyLifecycle,
        mount(container, props, locals) {
          const element =
            typeof ComponentClass === 'string' ? document.createElement(ComponentClass) : new ComponentClass();
          updateAttributes(element, props);
          container.appendChild(element);
          locals.ref = element;
        },
        update(props, locals) {
          updateAttributes(locals.ref, props);
        },
        unmount(container, locals) {
          locals.ref.remove();
          container.innerHTML = '';
        },
      };
    },
  };
}
