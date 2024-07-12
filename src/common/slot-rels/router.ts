import { tryJson } from '@/common/utils/json';
import type { DependencyInjector, SlotBehaviorService } from '@/types';

export function createSlotBehaviorForRouter(injector: DependencyInjector): SlotBehaviorService {
  const router = injector.get('router');

  return {
    apply({ name, data }) {
      const exData = tryJson(data, {});
      const match = router.matchRoute(name);

      if (match) {
        return [match.name, { ...exData, ...match.data }];
      }

      return [name, exData];
    },
  };
}
