import { getUrl } from '@/common/utils/url';
import { createEmptyMicrofrontend } from '@/common/utils/dto';
import type { PicardMicrofrontend } from '@/types';

export function fromManifest(feed: Record<string, string>, baseUrl?: string): Array<PicardMicrofrontend> {
  return Object.entries(feed).map(([name, path]) => {
    return createEmptyMicrofrontend(name, 'native', path, {
      url: getUrl(path, baseUrl),
    });
  });
}
