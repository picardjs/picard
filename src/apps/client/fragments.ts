import type { DependencyInjector, FragmentsService } from '@/types';

function getAttr(data: any): string {
  if (data) {
    const div = document.createElement('div');
    div.setAttribute('data', JSON.stringify(data));
    const html = div.outerHTML;
    return html.substring(4, html.length - 7);
  }

  return '';
}

function renderMeta(meta: any) {
  let result = '';

  if (meta) {
    if (typeof meta.server === 'string') {
      result += ` server="${meta.server}"`;
    }
    
    if (typeof meta.client === 'string') {
      result += ` client="${meta.client}"`;
    }
  }

  return result;
}

export function createFragments(injector: DependencyInjector): FragmentsService {
  const config = injector.get('config');
  const scope = injector.get('scope');

  const { componentName } = config;

  return {
    async load(name, data, options) {
      const components = await scope.loadComponents(name, options);
      const dataAttr = getAttr(data);
      const content = components.map(({ id, meta }) => `<${componentName} cid="${id}"${dataAttr}${renderMeta(meta)}></${componentName}>`);
      return Promise.resolve(content.join(''));
    },
  };
}
