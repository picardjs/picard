import { PicardMicrofrontend } from '@/types';

export function createEmptyMicrofrontend<T extends PicardMicrofrontend['format']>(
  name: string,
  format: T,
  source: string,
  details: any,
): PicardMicrofrontend {
  return {
    name,
    source,
    format,
    details,
    flags: 0,
    assets: [],
    components: [],
  };
}
