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

async function getChildContent(renderer: RendererService, attribs: Record<string, string>): Promise<string> {
  const data = JSON.parse(attribs.data || '{}');

  if ('cid' in attribs) {
    return renderer.render(attribs.cid).stringify(data);
  } else if ('name' in attribs) {
    await renderer.collect(attribs.name);
    return renderer.render({ name: attribs.name, source: attribs.source }).stringify(data);
  } else {
    return '';
  }
}

export function createDecorator(injector: DependencyInjector): DecoratorService {
  const { slotName, componentName, partName } = injector.get('config');
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
      const markers: Array<[string, Record<string, string>, number, number]> = [];
      traverse(document.childNodes, (m) => {
        if (m.type !== 'tag') {
          return false;
        }

        if (m.name === componentName || m.name === slotName) {
          const insert = m.endIndex! - 2 - m.name.length;
          markers.push([m.name, m.attribs, insert, 0]);
          return false;
        } else if (m.name === partName) {
          const start = m.startIndex!;
          const end = m.endIndex!;
          markers.push([m.name, m.attribs, start, end - start]);
        }

        return true;
      });

      // for slots use fragments

      let previous = 0;
      const parts: Array<string> = [content];

      for (const [name, attribs, index, length] of markers) {
        parts.pop();
        parts.push(content.substring(previous, index));

        if (name === componentName) {
          const childContent = await getChildContent(renderer, attribs);
          parts.push(childContent);
        } else if (name === slotName) {

        } else if (name === partName) {
          
        }

        previous = index + length;
        parts.push(content.substring(previous));
      }

      return parts.join('');
    },
  };
}
