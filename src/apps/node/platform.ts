import { createContext, Script, type SourceTextModule } from 'node:vm';
import { getVmModules } from './utils';
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

async function linkModule(url: string): Promise<SourceTextModule> {
  const res = await fetch(url);
  const content = await res.text();
  const { SourceTextModule } = getVmModules();
  // evaluated in the main context to have the globals (e.g., URL) of Node.js
  const mod = new SourceTextModule(content, { identifier: url });
  await mod.link((specifier) => {
    const newUrl = new URL(specifier, url);
    return linkModule(newUrl.href);
  });
  await mod.evaluate();
  return mod;
}

async function loadModule(url: string): Promise<Object> {
  const res = await linkModule(url);
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
