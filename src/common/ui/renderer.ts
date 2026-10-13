import { createLazyLifecycle } from '@/common/utils/lifecycle';
import type { DependencyInjector, RendererService } from '@/types';

export function createRenderer(injector: DependencyInjector): RendererService {
  const scope = injector.get('scope');

  function convert(component: any, meta: any, type: string) {
    const framework = injector.get(`framework.${type}`);
    return framework && component ? framework.convert(component, meta) : component;
  }

  return {
    render(component, opts) {
      const result = scope.getComponent(component);

      if (result) {
        return createLazyLifecycle(() =>
          result.then((c) => {
            const { meta, type = 'default' } = c;
            const { framework = type } = opts;
            const lc = convert(c.exports, meta, framework);

            if (!lc) {
              const name = c.name || component.cid || `${component.source}/${component.name}`;
              throw new Error(`The component "${name}" could not be loaded.`);
            }

            return lc;
          }),
        );
      }

      return undefined;
    },
  };
}
