import 'systemjs';
import 'systemjs/dist/extras/named-register.js';
import { satisfies, validate } from './version';
import { loadModule, registerDependencyResolvers, registerDependencyUrls } from './utils';
import type { DependencyInjector, DependencyModule, LoaderService } from '@/types';

declare const System: {
  registerRegistry: Record<string, any>;
  set(url: string, content: any): void;
  entries(): Iterable<[string, System.Module]>;
  resolve(name: string, parent?: string): string;
  import(name: string, parent?: string): Promise<System.Module>;
};

function isPrimitiveExport(content: any) {
  const type = typeof content;
  return (
    type === 'number' ||
    type === 'boolean' ||
    type === 'symbol' ||
    type === 'string' ||
    type === 'bigint' ||
    Array.isArray(content)
  );
}

function getLoadedVersions(prefix: string) {
  return [...System.entries()]
    .filter(([name]) => name.startsWith(prefix))
    .map(([name]) => name.substring(prefix.length));
}

function findMatchingPackage(id: string) {
  const sep = id.indexOf('@', 1);

  if (sep > 1) {
    const available = Object.keys(System.registerRegistry);
    const name = id.substring(0, sep + 1);
    const versionSpec = id.substring(sep + 1);

    if (validate(versionSpec)) {
      const loadedVersions = getLoadedVersions(name);
      const allVersions = available.filter((m) => m.startsWith(name)).map((m) => m.substring(name.length));
      // Moves the loaded versions to the top
      const availableVersions = [...loadedVersions, ...allVersions.filter((m) => !loadedVersions.includes(m))];

      for (const availableVersion of availableVersions) {
        if (validate(availableVersion) && satisfies(availableVersion, versionSpec)) {
          return name + availableVersion;
        }
      }
    }
  }

  return undefined;
}

export function createLoader(injector: DependencyInjector): LoaderService {
  const events = injector.get('events');
  const { dependencies } = injector.get('config');

  const systemResolve = System.constructor.prototype.resolve;
  const systemRegister = System.constructor.prototype.register;

  const innerResolve = (context: any, id: string, parentUrl: string): string => {
    try {
      return systemResolve.call(context, id, parentUrl);
    } catch (ex) {
      const result = findMatchingPackage(id);

      if (!result) {
        throw ex;
      }

      return result;
    }
  };

  System.constructor.prototype.resolve = function (id: string, parentUrl: string) {
    const result = innerResolve(this, id, parentUrl);
    events.emit('resolved-dependency', { id, parentUrl, result });
    return result;
  };

  System.constructor.prototype.register = function (...args) {
    const getContent = args.pop() as System.DeclareFn;

    args.push((_export, ctx) => {
      const exp = (...p) => {
        if (p.length === 1) {
          const content = p[0];

          if (content instanceof Promise) {
            return content.then(exp);
          } else if (typeof content === 'function') {
            _export('__esModule', true);
            Object.keys(content).forEach((prop) => {
              _export(prop, content[prop]);
            });
            _export('default', content);
          } else if (isPrimitiveExport(content)) {
            _export('__esModule', true);
            _export('default', content);
          } else if (content) {
            _export(content);

            if (typeof content === 'object' && !('default' in content)) {
              _export('default', content);
            }
          }
        } else {
          return _export(...p);
        }
      };
      return getContent(exp, ctx);
    });

    return systemRegister.apply(this, args);
  };

  registerDependencyResolvers(dependencies);

  return {
    registerUrls(dependencies) {
      registerDependencyUrls(dependencies);
    },
    registerResolvers(dependencies) {
      registerDependencyResolvers(dependencies);
    },
    registerModule(url, content) {
      System.set(url, content);
    },
    load(url) {
      return loadModule(url);
    },
    import(entry, parent) {
      return System.import(entry, parent);
    },
    list() {
      const dependencies: Array<DependencyModule> = [];

      for (const id of Object.keys(System.registerRegistry)) {
        const index = id.lastIndexOf('@');

        if (index > 0 && !id.match(/^https?:\/\//)) {
          const name = id.substring(0, index);
          const version = id.substring(index + 1);

          dependencies.push({
            id,
            name,
            version,
          });
        }
      }

      return dependencies;
    },
  };
}
