import type { DependencyInjector, FragmentsService } from '@/types';

export function createFragments(injector: DependencyInjector): FragmentsService {
  const config = injector.get('config');
  const renderer = injector.get('renderer');

  const { componentName } = config;

  return {
    async load(name, parameters) {
      const ids = await renderer.collect(name);
      const parts = await Promise.all(ids.map((id) => renderer.render(id).stringify(parameters)));
      return ids.map((id, i) => `<${componentName} cid="${id}">${parts[i]}</${componentName}>`).join('');
    },
  };
}
