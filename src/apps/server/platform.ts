import { createContext, SourceTextModule, Script, Context } from 'vm';

async function loadScript(url: string, integrity?: string, crossOrigin?: string) {
  const res = await fetch(url, {
    mode: (crossOrigin && 'cors') || undefined,
  });

  const content = await res.text();
  const ctx = createContext();
  const script = new Script(content);
  script.runInContext(ctx);
}

async function linkModule(url: string, ctx: Context) {
  const res = await fetch(url);
  const content = await res.text();
  const mod = new SourceTextModule(content);
  mod.context = ctx;
  await mod.link((specifier) => linkModule(specifier, ctx));
  await mod.evaluate();
  return mod;
}

async function loadModule(url: string) {
  const ctx = createContext();
  await linkModule(url, ctx);
}

async function loadJson<T = any>(url: string) {
  const res = await fetch(url);
  const doc: T = await res.json();
  return doc;
}

export function createPlatform() {
  return {
    loadJson,
    loadModule,
    loadScript,
  };
}
