import type { DependencyInjector, FragmentsService } from '@/types';

export function createFragments(injector: DependencyInjector): FragmentsService {
  const config = injector.get('config');
  const scope = injector.get('scope');

  const { componentName } = config;

  return {
    async load(name) {
      const ids = await scope.loadComponents(name);
      const content = ids.map((id) => `<${componentName} cid="${id}"></${componentName}>`);
      return Promise.resolve(content.join(''));
    },
  };
}
