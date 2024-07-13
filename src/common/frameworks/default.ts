import { emptyLifecycle, createLazyLifecycle } from '@/common/utils/lifecycle';
import type { ConverterService, ComponentLifecycle } from '@/types';

export function createDefaultConverter(): ConverterService {
  return {
    convert(component: Partial<ComponentLifecycle> | (() => Promise<Partial<ComponentLifecycle>>) = {}) {
      if (typeof component === 'function') {
        return createLazyLifecycle(component);
      }

      return {
        ...emptyLifecycle,
        ...component,
      };
    },
  };
}
