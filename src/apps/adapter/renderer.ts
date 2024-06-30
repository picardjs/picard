import type { RendererService } from '@/types';

export function createRenderer(): RendererService {
  return {
    render(component) {
      return undefined;
    },
  };
}
