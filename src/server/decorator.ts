import { parseDocument } from 'htmlparser2';
import type { ChildNode } from 'domhandler';
import type { DependencyInjector, RendererService } from '../types';

export interface DecoratorService {
  decorate(content: string): Promise<string>;
}

function traverse(nodes: Array<ChildNode>, cb: (node: ChildNode) => boolean) {
  nodes.forEach((node) => {
    if (cb(node) && node.type === 'tag') {
      traverse(node.childNodes, cb);
    }
  });
}

function getChildContent(renderer: RendererService, attribs: Record<string, string>) {
  const data = JSON.parse(attribs.data || '{}');

  if ('cid' in attribs) {
    return renderer.render(attribs.cid).stringify(data);
  } else if ('name' in attribs) {
    return renderer.render({ name: attribs.name, source: attribs.source }).stringify(data);
  } else {
    return '';
  }
}

export function createDecorator(injector: DependencyInjector): DecoratorService {
  const { slotName, componentName } = injector.get('config');
  const fragments = injector.get('fragments');
  const renderer = injector.get('renderer');
  const queue = injector.get('feed');

  return {
    async decorate(content) {
      await queue.current;

      const document = parseDocument(content, {
        withStartIndices: true,
        withEndIndices: true,
      });
      const markers: Record<string, Array<[Record<string, string>, number]>> = {
        [componentName]: [],
        [slotName]: [],
      };
      traverse(document.childNodes, (m) => {
        if (m.type !== 'tag') {
          return false;
        }

        if (m.name === componentName || m.name === slotName) {
          const insert = m.endIndex! - 2 - m.name.length;
          markers[m.name].push([m.attribs, insert]);
          return false;
        }

        return true;
      });

      // for slots use fragments

      let previous = 0;
      const parts: Array<string> = [content];

      for (const [attribs, index] of markers[componentName]) {
        const childContent = getChildContent(renderer, attribs);
        parts.pop();
        parts.push(content.substring(previous, index));
        parts.push(childContent);
        parts.push(content.substring(index));
        previous = index;
      }

      return parts.join('');
    },
  };
}
