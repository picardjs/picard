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
