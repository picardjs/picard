import { parseDocument } from 'htmlparser2';
import { render } from 'dom-serializer';
import type { ChildNode, Document, Element } from 'domhandler';
import type { DependencyInjector } from '@/types';

interface Decorator {
  (content: string): Promise<string>;
}

export interface DecoratorService {
  decorate: Decorator;
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

function escapeHtml(str: string) {
  return str.replace(
    /[&<>'"]/g,
    (tag) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      })[tag],
  );
}

async function Component(injector: DependencyInjector, attribs: Record<string, string>): Promise<string> {
  const data = tryJson(attribs.data, {});

  if ('cid' in attribs || 'name' in attribs) {
    const renderer = injector.get('renderer');
    const lc = renderer.render(attribs);

    if (lc) {
      //TODO fallback?!
      await lc.bootstrap?.();
      return await lc.stringify?.(data);
    }
  }

  return '';
}

async function Slot(
  injector: DependencyInjector,
  attribs: Record<string, string>,
  document: Document,
): Promise<string> {
  const name = attribs.name;
  const data = tryJson(attribs.data, {});
  const { componentName } = injector.get('config');
  const scope = injector.get('scope');
  const cids = await scope.loadComponents(name);

  const content = cids
    .map(
      (id, i) =>
        `<${componentName} cid=${JSON.stringify(id)} data="${escapeHtml(JSON.stringify(data))}"></${componentName}>`,
    )
    .join('');
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
  if (attribs.name === 'style') {
    const scope = injector.get('scope');
    const sheet = injector.get('sheet');
    const assets = await scope.loadAssets('css');

    const internals = `<style>${sheet?.content}</style>`;

    const externals = assets
      .map((id) => scope.retrieveAsset(id))
      .filter(Boolean)
      .map(
        (asset) =>
          `<link rel="stylesheet" href=${JSON.stringify(asset.url)} data-origin=${JSON.stringify(asset.origin.name)} data-ref-id=${JSON.stringify(asset.id)}>`,
      )
      .join('');

    return `${internals}${externals}`;
  }

  return `<!-- here would be the part for "${attribs.name}" -->`;
}

export function createDecorator(injector: DependencyInjector): DecoratorService {
  const { slotName, componentName, partName } = injector.get('config');

  const components: Record<string, ServerComponent> = {
    [slotName]: Slot,
    [componentName]: Component,
    [partName]: Part,
  };

  const decorate = async (content: string, count = 0) => {
    if (count === 10) {
      console.warn('Reached maximum recursion in decorator. Returning content.');
      return content;
    }

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
        markers.push([m.name, m.attribs, start, end - start + 1]);
      }

      return true;
    });

    let previous = 0;
    const parts: Array<string> = [content];

    for (const [name, attribs, index, length] of markers) {
      const render = components[name];
      parts.pop();
      parts.push(content.substring(previous, index));
      const replacement = await render(injector, attribs, document);
      const result = await decorate(replacement, count + 1);
      parts.push(result);
      previous = index + length;
      parts.push(content.substring(previous));
    }

    return parts.join('');
  };

  return {
    decorate,
  };
}
