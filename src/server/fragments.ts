import type { DependencyInjector, FragmentsService } from '../types';

export function createFragments(injector: DependencyInjector): FragmentsService {
  const config = injector.get('config');
  const renderer = injector.get('renderer');

  const { componentName } = config;

  return {
    async load(name) {
      const ids = await renderer.collect(name);
      const content = ids.map((id) => `<${componentName} cid="${id}"></${componentName}>`);
      return Promise.resolve(content.join(''));
    },
  };
}
