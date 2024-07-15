import { createContext, SourceTextModule, Script, Context } from 'vm';
import type { PlatformService } from '@/types';

async function loadScript(url: string, integrity?: string, crossOrigin?: string): Promise<void> {
  const res = await fetch(url, {
    mode: (crossOrigin && 'cors') || undefined,
  });

  const content = await res.text();
  const ctx = createContext();
  const script = new Script(content);
  script.runInContext(ctx);
}

async function linkModule(url: string, ctx: Context): Promise<SourceTextModule> {
  const res = await fetch(url);
  const content = await res.text();
  const mod = new SourceTextModule(content);
  mod.context = ctx;
  await mod.link((specifier) => {
    const newUrl = new URL(specifier, url);
    return linkModule(newUrl.href, ctx);
  });
  await mod.evaluate();
  return mod;
}

async function loadModule(url: string): Promise<Object> {
  const ctx = createContext();
  const res = await linkModule(url, ctx);
  return res.namespace;
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
