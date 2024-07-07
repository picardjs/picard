import { emptyLifecycle } from '@/common/utils/lifecycle';
import type { ConverterService } from '@/types';

interface SingleSpaParcel {
  bootstrap(): Promise<void>;
  mount(props: any): void;
  unmount(props: any): void;
  update(props: any): void;
}

export function createSingleSpaConverter(): ConverterService {
  return {
    convert(component: SingleSpaParcel) {
      return {
        ...emptyLifecycle,
        bootstrap() {
          return component.bootstrap();
        },
        mount(container, props, locals) {
          locals.container = container;
          component.mount({
            ...props,
            domElement: container,
          });
        },
        unmount(container) {
          component.unmount({
            domElement: container,
          });
        },
        update(props, locals) {
          component.update?.({ ...props, domElement: locals.container });
        },
      };
    },
  };
}
