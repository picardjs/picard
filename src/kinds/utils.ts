export interface ModuleResolver {
  (): any;
}

function handleFailure(error: Error, link: string) {
  console.error('Failed to load SystemJS module', link, error);
}

/**
 * Registers a plain module in SystemJS.
 * @param name The name of the module
 * @param resolve The resolver for the module's content.
 */
export function registerModule(name: string, resolve: ModuleResolver) {
  System.register(name, [], (_exports) => ({
    execute() {
      const content = resolve();

      if (content instanceof Promise) {
        return content.then(_exports);
      } else {
        _exports(content);
      }
    },
  }));
}

/**
 * Registers the given dependency URLs in SystemJS.
 * @param dependencies The dependencies to resolve later.
 */
export function registerDependencyUrls(dependencies: Record<string, string>) {
  for (const name of Object.keys(dependencies)) {
    if (!System.has(name)) {
      const dependency = dependencies[name];
      registerModule(name, () => System.import(dependency));
    }
  }
}

/**
 * Imports a module via SystemJS.
 * @param url The link to the module's root module.
 * @returns The evaluated module or an empty module in case of an error.
 */
export async function loadModule(url: string) {
  try {
    return await System.import(url);
  } catch (error) {
    return handleFailure(error, url);
  }
}

/**
 * Loads a script.
 * @param url The URL of the script.
 * @param integrity The integrity for the script, if any.
 * @param crossOrigin Defines if cross-origin should be used.
 * @returns The script element.
 */
export function loadScript(url: string, integrity?: string, crossOrigin?: string) {
  return new Promise<HTMLScriptElement>((resolve, reject) => {
    const s = document.createElement('script');
    s.async = true;
    s.src = url;

    if (integrity) {
      s.crossOrigin = crossOrigin || 'anonymous';
      s.integrity = integrity;
    } else if (crossOrigin) {
      s.crossOrigin = crossOrigin;
    }

    s.onload = () => resolve(s);
    s.onerror = (e) => reject(e);
    document.body.appendChild(s);
  });
}

/**
 * Includes a JSON document.
 * @param url The URL of the JSON document.
 * @returns The content of the JSON document.
 */
export async function loadJson<T = any>(url: string) {
  const res = await fetch(url);
  const doc: T = await res.json();
  return doc;
}
