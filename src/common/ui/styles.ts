import type { DependencyInjector, SheetService } from '@/types';

export function createSheet(injector: DependencyInjector): SheetService {
  const { slotName, componentName, partName } = injector.get('config');
  const content = `${slotName} { display: contents; } ${componentName} { display: contents; } ${partName} { display: none; }`;

  return {
    content,
  };
}
