import { emptyLifecycle } from '@/common/utils/lifecycle';
import type { ConverterService } from '@/types';

interface SingleSpaParcel {
  bootstrap(): Promise<void>;
  mount(props: any): Promise<void>;
  unmount(props: any): Promise<void>;
  update(props: any): Promise<void>;
  unload(): Promise<void>;
}

export function createSingleSpaConverter(): ConverterService {
  return {
    convert(component: SingleSpaParcel) {
      return {
        ...emptyLifecycle,
        load() {
          return component.bootstrap?.() ?? Promise.resolve();
        },
        unload() {
          return component.unload?.() ?? Promise.resolve();
        },
        mount(container, props, locals) {
          locals.container = container;
          component.mount({
            ...props,
            domElement: container,
          });
        },
        unmount(container) {
          component
            .unmount({
              domElement: container,
            })
            .catch(() => {});
        },
        update(props, locals) {
          component.update?.({ ...props, domElement: locals.container });
        },
      };
    },
  };
}
