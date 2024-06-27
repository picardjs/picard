import { PicardMicrofrontend } from '@/types';

export function createEmptyMicrofrontend<T extends PicardMicrofrontend['kind']>(
  name: string,
  kind: T,
  source: string,
  details: any,
): PicardMicrofrontend {
  return {
    kind,
    name,
    details,
    source,
    assets: [],
    components: {},
  };
}
