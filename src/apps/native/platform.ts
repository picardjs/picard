import type { PlatformService } from '@/types';

async function loadScript(url: string, integrity?: string, crossOrigin?: string): Promise<void> {
  const res = await fetch(url, {
    mode: (crossOrigin && 'cors') || undefined,
  });

  const content = await res.text();
  const fn = new Function(content);
  fn();
}

async function loadModule(url: string): Promise<any> {
  return await import(url);
}

async function loadJson<T = any>(url: string): Promise<T> {
  const res = await fetch(url);
  const doc: T = await res.json();
  return doc;
}

export function createPlatform(): PlatformService {
  return {
    loadJson,
    loadModule,
    loadScript,
  };
}
