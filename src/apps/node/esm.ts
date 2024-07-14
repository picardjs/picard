import { createContext, SourceTextModule, Context, SyntheticModule } from 'vm';
import type { EsmService } from '@/types';

export function createEsm(): EsmService {
  const cache: Record<string, SyntheticModule> = {};

  async function linkModule(url: string, ctx: Context, depMap: Record<string, string>, parent: string) {
    const res = await fetch(url);
    const content = await res.text();
    const mod = new SourceTextModule(content, {
      initializeImportMeta(meta) {
        meta.url = url;
      },
    });
    
    mod.context = ctx;

    await mod.link(async (specifier) => {
      const dep = depMap[specifier];
      const entry = cache[dep];

      if (entry) {
        return entry;
      }
  
      if (dep) {
        const result = await System.import(dep, parent);
        const names = Object.keys(result);
        return cache[dep] = new SyntheticModule(names, function () {
          for (const name of names) {
            this.setExport(name, result[name]);
          }
        });
      }
  
      const newUrl = new URL(specifier, url);
      return await linkModule(newUrl.href, ctx, depMap, parent);
    });

    await mod.evaluate();
    return mod;
  }

  return {
    async load(url, depMap, parent) {
      const ctx = createContext();
      const mod = await linkModule(url, ctx, depMap, parent);
      return mod.namespace;
    },
  };
}
