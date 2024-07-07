function createScript(url: string, integrity?: string, crossOrigin?: string) {
  const s = document.createElement('script');
  s.async = true;
  s.src = url;

  if (integrity) {
    s.crossOrigin = crossOrigin || 'anonymous';
    s.integrity = integrity;
  } else if (crossOrigin) {
    s.crossOrigin = crossOrigin;
  }

  return s;
}

function loadScript(url: string, integrity?: string, crossOrigin?: string) {
  return new Promise((resolve, reject) => {
    const s = createScript(url, integrity, crossOrigin);
    s.onload = resolve;
    s.onerror = reject;
    document.body.appendChild(s);
  });
}

function loadModule(url: string) {
  return import(/* @vite-ignore */ /* webpackIgnore:true */ url);
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
