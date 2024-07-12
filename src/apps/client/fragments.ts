import type { DependencyInjector, FragmentsService } from '@/types';

function getAttrValue(data: any) {
  if (data) {
    const div = document.createElement('div');
    div.setAttribute('data', JSON.stringify(data));
    const html = div.outerHTML;
    return html.substring(4, html.length - 7);
  }

  return '';
}

export function createFragments(injector: DependencyInjector): FragmentsService {
  const config = injector.get('config');
  const scope = injector.get('scope');

  const { componentName } = config;

  return {
    async load(name, data) {
      const ids = await scope.loadComponents(name);
      const rest = getAttrValue(data);
      const content = ids.map((id) => `<${componentName} cid="${id}"${rest}></${componentName}>`);
      return Promise.resolve(content.join(''));
    },
  };
}
