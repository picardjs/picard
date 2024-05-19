type FragmentLoader = (name: string, parameters: any) => Promise<string>;

export interface FragmentsOptions {
  fragmentUrl?: string;
  componentName?: string;
  collect?(component: string): Promise<Array<string>>;
}

const defaultOptions: Required<FragmentsOptions> = {
  fragmentUrl: '',
  componentName: 'pi-component',
  collect() {
    return Promise.resolve([]);
  },
};

export function createFragments(options: FragmentsOptions = defaultOptions): FragmentLoader {
  const {
    fragmentUrl = defaultOptions.fragmentUrl,
    componentName = defaultOptions.componentName,
    collect = defaultOptions.collect,
  } = options;

  if (!fragmentUrl) {
    return async (name) => {
      const ids = await collect(name);
      const content = ids.map((id) => `<${componentName} cid="${id}"></${componentName}>`);
      return Promise.resolve(content.join(''));
    };
  }

  return async (name, params) => {
    const query = Object.entries(params || {})
      .map(([name, value]) => `${encodeURIComponent(name)}=${encodeURIComponent(value as string)}`)
      .join('&');

    const suffix = query ? `?${query}` : '';
    const path = btoa(name);

    const res = await fetch(`${fragmentUrl}/${path}${suffix}`, {
      method: 'GET',
    });

    return res.text();
  };
}
