import { parseDocument } from 'htmlparser2';
import type { ChildNode, Document } from 'domhandler';
import type { DependencyInjector } from '@/types';

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

type ServerComponent = (injector: DependencyInjector, attribs: Record<string, string>, document: Document) => Promise<string>;

async function Component(injector: DependencyInjector, attribs: Record<string, string>): Promise<string> {
  const data = JSON.parse(attribs.data || '{}');

  if ('cid' in attribs) {
    const renderer = injector.get('renderer');
    return renderer.render(attribs.cid).stringify(data);
  } else if ('name' in attribs) {
    const renderer = injector.get('renderer');
    await renderer.collect(attribs.name);
    return renderer.render({ name: attribs.name, source: attribs.source }).stringify(data);
  }
  
  return '';
}

async function Slot(injector: DependencyInjector, attribs: Record<string, string>): Promise<string> {
  return '';
}

async function Part(injector: DependencyInjector, attribs: Record<string, string>): Promise<string> {
  return '';
}

export function createDecorator(injector: DependencyInjector): DecoratorService {
  const { slotName, componentName, partName } = injector.get('config');
  const queue = injector.get('feed');

  const components: Record<string, ServerComponent> = {
    [slotName]: Slot,
    [componentName]: Component,
    [partName]: Part,
  };

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

      let previous = 0;
      const parts: Array<string> = [content];

      for (const [name, attribs, index, length] of markers) {
        const render = components[name];
        parts.pop();
        parts.push(content.substring(previous, index));
        parts.push(await render(injector, attribs, document));
        previous = index + length;
        parts.push(content.substring(previous));
      }

      return parts.join('');
    },
  };
}
