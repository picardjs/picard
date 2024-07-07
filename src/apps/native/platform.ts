async function loadScript(url: string, integrity?: string, crossOrigin?: string) {
  const res = await fetch(url, {
    mode: (crossOrigin && 'cors') || undefined,
  });

  const content = await res.text();
  const fn = new Function(content);
  fn();
}

async function loadModule(url: string) {
  return await import(url);
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
