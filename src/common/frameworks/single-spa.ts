import type { ConverterService } from "@/types";

export function createSingleSpa(): ConverterService {
  return {
    convert(component) {
      return {
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
        unload() {
          return Promise.resolve();
        },
        stringify() {
          return Promise.resolve('');
        },
      };
    },
  };
}
