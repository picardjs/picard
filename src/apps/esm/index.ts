import { transform } from './transform';

const promises: Record<string, Promise<any>> = {};

type __Import = (id: string) => Promise<any>;
type __Exports = Record<string, any>;

function loadModule(url: string, parent: string, depMap: Record<string, string>) {
  return (
    promises[url] ||
    (promises[url] = fetch(url)
      .then((r) => r.text())
      .then((text) => evaluate(transform(text, url, parent, depMap))))
  );
}

function loadDependency(id: string, url: string, parent: string, depMap: Record<string, string>) {
  const depId = depMap[id];

  if (depId) {
    return System.import(depId, parent);
  }

  return loadModule(new URL(id, url).href, parent, depMap);
}

let uid = 1;

function evaluate(code: string) {
  return new Promise((resolve) => {
    const id = `m${uid++}`;

    // creating a script tag gives us proper stack traces
    const blob = new Blob([`__shimport__.${id}=${code}`], {
      type: 'application/javascript',
    });

    const script = document.createElement('script');
    script.src = URL.createObjectURL(blob);

    script.onload = () => {
      //@ts-ignore
      const sp = window.__shimport__;
      resolve(sp[id]);
      delete sp[id];
      script.remove();
    };

    document.head.appendChild(script);
  });
}

export async function define(
  url: string,
  parent: string,
  deps: Array<string>,
  factory: (__import: __Import, __exports: __Exports, ...deps: Array<any>) => void,
  depMap: Record<string, string>,
) {
  const __import = (dep: string) => loadDependency(dep, url, parent, depMap);
  const __deps = await Promise.all(deps.map(__import));
  const __exports = {};
  factory(__import, __exports, ...__deps);
  return __exports;
}

export function load(url: string, depMap: Record<string, string>, parent: string) {
  return loadModule(url, parent, depMap);
}
