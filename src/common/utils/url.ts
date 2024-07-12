export function getUrl(source: string, baseUrl?: string) {
  if (baseUrl) {
    return new URL(source, baseUrl).href;
  } else if (typeof location !== 'undefined') {
    return getUrl(source, location.href);
  } else {
    return source;
  }
}
