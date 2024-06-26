import type { ComponentGetter } from './components';

export interface ContainerService {
  createContainer(details: any): Promise<ComponentGetter>;
}
