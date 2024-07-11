import { emptyLifecycle } from '@/common/utils/lifecycle';
import type { ConverterService } from '@/types';

interface HtmlLocals {
  queue: Promise<void>;
  container: HTMLElement;
}

function updateContent(content: string | Promise<string>, locals: HtmlLocals) {
  const queue: Promise<void> = locals.queue;
  const container: HTMLElement = locals.container;

  if (typeof content === 'string') {
    container.innerHTML = content;
  } else if (content instanceof Promise) {
    locals.queue = queue
      .then(() => content)
      .then((c) => {
        container.innerHTML = c;
      });
  }
}

export function createHtmlConverter(): ConverterService {
  return {
    convert(html: string | ((props: any) => Promise<string>)) {
      return {
        ...emptyLifecycle,
        mount(container, props, locals) {
          locals.queue = Promise.resolve();
          locals.container = container;
          const content = typeof html === 'function' ? html(props) : html;
          updateContent(content, locals);
        },
        unmount() {},
        update(props, locals) {
          if (typeof html === 'function') {
            const content = html(props);
            updateContent(content, locals);
          }
        },
        async stringify(props) {
          return typeof html === 'function' ? await html(props) : html;
        },
      };
    },
  };
}
