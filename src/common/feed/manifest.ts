import { createEmptyMicrofrontend } from '@/common/utils/dto';
import type { PicardMicrofrontend } from '@/types';

export function fromManifest(feed: Record<string, string>): Array<PicardMicrofrontend> {
  return Object.entries(feed).map(([name, url]) => {
    return createEmptyMicrofrontend(name, 'native', url, {
      url,
    });
  });
}
