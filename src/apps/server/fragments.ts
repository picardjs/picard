import type { DependencyInjector, FragmentsService } from '@/types';

export function createFragments(injector: DependencyInjector): FragmentsService {
  const config = injector.get('config');
  const scope = injector.get('scope');
  const renderer = injector.get('renderer');

  const { componentName } = config;

  return {
    async load(name, parameters) {
      const cids = await scope.loadComponents(name);
      const parts = await Promise.all(cids.map((cid) => renderer.render({ cid }).stringify(parameters)));
      return cids.map((id, i) => `<${componentName} cid="${id}">${parts[i]}</${componentName}>`).join('');
    },
  };
}
