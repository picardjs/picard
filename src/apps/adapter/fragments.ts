import type { DependencyInjector, FragmentsService } from '@/types';

export function createFragments(injector: DependencyInjector): FragmentsService {
  const config = injector.get('config');
  const { fragmentUrl } = config;

  return {
    async load(name, params) {
      const query = Object.entries(params || {})
        .map(([name, value]) => `${encodeURIComponent(name)}=${encodeURIComponent(value as string)}`)
        .join('&');

      const suffix = query ? `?${query}` : '';
      const path = btoa(name);

      const res = await fetch(`${fragmentUrl}/${path}${suffix}`, {
        method: 'GET',
      });

      return res.text();
    },
  };
}
