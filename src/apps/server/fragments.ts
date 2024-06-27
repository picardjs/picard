import type { DependencyInjector, FragmentsService } from '@/types';

export function createFragments(injector: DependencyInjector): FragmentsService {
  const config = injector.get('config');
  const scope = injector.get('scope');
  const decorator = injector.get('decorator');

  const { componentName } = config;

  return {
    async load(name, parameters) {
      const cids = await scope.loadComponents(name);
      const content = cids
        .map(
          (id, i) =>
            `<${componentName} cid=${JSON.stringify(id)} data=${JSON.stringify(parameters)}></${componentName}>`,
        )
        .join('');
      return decorator.decorate(content);
    },
  };
}
