import { emptyLifecycle } from '@/common/utils/lifecycle';
import type { ConverterService, ComponentLifecycle } from '@/types';

export function createDefaultConverter(): ConverterService {
  return {
    convert(component: Partial<ComponentLifecycle> = {}) {
      return {
        ...emptyLifecycle,
        ...component,
      };
    },
  };
}
