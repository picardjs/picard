import { createContext, type Context, type SyntheticModule } from 'node:vm';
import { getVmModules } from './utils';
import { system } from '@/common/loader';
import type { EsmService } from '@/types';

export function createEsm(): EsmService {
  async function linkModule(
    url: string,
    context: Context,
    cache: Record<string, SyntheticModule>,
    depMap: Record<string, string>,
    parent: string,
  ) {
    const res = await fetch(url);
    const content = await res.text();
    const { SourceTextModule, SyntheticModule } = getVmModules();
    // all linked modules must be created in the same context
    const mod = new SourceTextModule(content, {
      identifier: url,
      context,
      initializeImportMeta(meta) {
        meta.url = url;
      },
    });

    await mod.link(async (specifier) => {
      const dep = depMap[specifier];
      const entry = cache[dep];

      if (entry) {
        return entry;
      }

      if (dep) {
        const result = await system.import(dep, parent);
        const names = Object.keys(result);
        return (cache[dep] = new SyntheticModule(
          names,
          function () {
            for (const name of names) {
              this.setExport(name, result[name]);
            }
          },
          { context },
        ));
      }

      const newUrl = new URL(specifier, url);
      return await linkModule(newUrl.href, context, cache, depMap, parent);
    });

    await mod.evaluate();
    return mod;
  }

  return {
    async load(url, depMap, parent) {
      const context = createContext();
      const mod = await linkModule(url, context, {}, depMap, parent);
      return mod.namespace;
    },
  };
}
