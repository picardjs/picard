import { parseDocument } from 'htmlparser2';
import { render } from 'dom-serializer';
import type { ChildNode, Document, Element } from 'domhandler';
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

function findById(container: Document | Element, id: string): Element {
  let result: Element = undefined;

  traverse(container.childNodes, (node) => {
    if (node.type === 'tag' && node.attribs.id === id) {
      result = node;
    }

    return !result;
  });

  return result;
}

function findByName(container: Document | Element, name: string): Element {
  let result: Element = undefined;

  traverse(container.childNodes, (node) => {
    if (node.type === 'tag' && node.name === name) {
      result = node;
    }

    return !result;
  });

  return result;
}

function tryJson(content: string, fallback: any) {
  if (content) {
    try {
      return JSON.parse(content);
    } catch {
      // empty on purpose
    }
  }
  return fallback;
}

type ServerComponent = (
  injector: DependencyInjector,
  attribs: Record<string, string>,
  document: Document,
) => Promise<string>;

async function Component(injector: DependencyInjector, attribs: Record<string, string>): Promise<string> {
  const data = tryJson(attribs.data, {});

  if ('cid' in attribs) {
    const renderer = injector.get('renderer');
    return await renderer.render(attribs.cid).stringify(data);
  } else if ('name' in attribs) {
    const renderer = injector.get('renderer');
    await renderer.collect(attribs.name);
    return await renderer.render({ name: attribs.name, source: attribs.source }).stringify(data);
  }

  return '';
}

async function Slot(
  injector: DependencyInjector,
  attribs: Record<string, string>,
  document: Document,
): Promise<string> {
  const name = attribs.name;
  const params = tryJson(attribs.params, {});
  const fragments = injector.get('fragments');
  const content = await fragments.load(name, params);
  const itemTemplateId = attribs['item-template-id'];

  if (itemTemplateId) {
    const template = findById(document, itemTemplateId);
    const innerDocument = parseDocument(content);

    if (template) {
      const frags = innerDocument.childNodes.map((item) => {
        const copy = template.cloneNode(true);
        const slot = findByName(copy, 'slot');

        if (slot) {
          const slotIndex = slot.parent.childNodes.indexOf(slot);
          slot.parent.childNodes[slotIndex] = item;
        }

        return render(copy.childNodes);
      });

      return frags.join('');
    }
  }

  return content;
}

async function Part(injector: DependencyInjector, attribs: Record<string, string>): Promise<string> {
  return `<!-- here would be the part for "${attribs.name}" -->`;
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
