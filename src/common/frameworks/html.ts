import { emptyLifecycle } from '@/common/utils/lifecycle';
import type { ConverterService } from '@/types';

export function createHtmlConverter(): ConverterService {
  return {
    convert(html: string | ((props: any) => string)) {
      return {
        ...emptyLifecycle,
        mount(container, props, locals) {
          const content = typeof html === 'function' ? html(props) : html;
          container.innerHTML = content;
          locals.container = container;
        },
        unmount() {},
        update(props, locals) {
          if (typeof html === 'function') {
            locals.container.innerHTML = html(props);
          }
        },
        stringify(props) {
          const content = typeof html === 'function' ? html(props) : html;
          return Promise.resolve(content);
        },
      };
    },
  };
}
