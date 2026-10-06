import { satisfies, validate } from './version';

export type ModuleNamespace = Record<string, any>;
export type ModuleExport = ((name: string, value: any) => any) & ((values: ModuleNamespace) => ModuleNamespace);
export type ModuleSetter = (module: ModuleNamespace) => void;

export interface ModuleDeclaration {
  setters?: Array<ModuleSetter | undefined>;
  execute?: () => void | Promise<void>;
}

export interface ModuleContext {
  id: string;
  meta: { url: string };
  import(id: string): Promise<ModuleNamespace>;
  resolve(id: string): string;
}

export type ModuleDeclare = (exportModule: ModuleExport, context: ModuleContext) => ModuleDeclaration;

interface ModuleRecord {
  id: string;
  name?: string;
  version?: string;
  dependencies: Array<string>;
  declare?: ModuleDeclare;
  namespace: ModuleNamespace;
  importers: Array<ModuleSetter>;
  state: 'registered' | 'linking' | 'executing' | 'evaluated' | 'failed';
  error?: unknown;
  declaration?: ModuleDeclaration;
  evaluation?: Promise<ModuleNamespace>;
  waitingFor?: ModuleRecord;
}

export interface PicardSystem {
  register(name: string, dependencies: Array<string>, declare: ModuleDeclare): void;
  register(dependencies: Array<string>, declare: ModuleDeclare): void;
  registerRegistry: Record<string, true>;
  set(id: string, value: any): void;
  get(id: string): ModuleNamespace | undefined;
  has(id: string): boolean;
  entries(): Iterable<[string, ModuleNamespace]>;
  resolve(id: string, parent?: string): string;
  import(id: string, parent?: string): Promise<ModuleNamespace>;
  list(): Array<{ id: string; name: string; version: string }>;
  setResolveListener(listener: (id: string, parent: string | undefined, result: string) => void): void;
}

const exactVersion = /^\d+\.\d+\.\d+(?:-[\da-z-]+(?:\.[\da-z-]+)*)?(?:\+[\da-z-]+(?:\.[\da-z-]+)*)?$/i;

function splitPackageId(id: string) {
  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(id)) {
    return undefined;
  }

  const separator = id.lastIndexOf('@');

  if (separator <= 0) {
    return undefined;
  }

  return {
    name: id.substring(0, separator),
    version: id.substring(separator + 1),
  };
}

function getPackageMetadata(id: string) {
  const packageId = splitPackageId(id);

  if (packageId && exactVersion.test(packageId.version)) {
    return packageId;
  }

  return undefined;
}

function findMatchingPackage(modules: Map<string, ModuleRecord>, id: string) {
  const requested = splitPackageId(id);

  if (requested && validate(requested.version)) {
    const available = [...modules.values()].filter(
      (module) => module.name === requested.name && module.version && satisfies(module.version, requested.version),
    );
    const preferred = available.find((module) => module.state === 'evaluated') || available[0];

    return preferred?.id;
  }

  return undefined;
}

export function createSystem(): PicardSystem {
  const modules = new Map<string, ModuleRecord>();
  const loading = new Map<string, Promise<ModuleRecord>>();
  const registerRegistry: Record<string, true> = Object.create(null);
  let resolveListener: ((id: string, parent: string | undefined, result: string) => void) | undefined;
  let registeringUrl: string | undefined;

  function register(...args: [string, Array<string>, ModuleDeclare] | [Array<string>, ModuleDeclare]) {
    const named = typeof args[0] === 'string';
    const id = named ? args[0] : registeringUrl || (globalThis as any).document?.currentScript?.src;
    const dependencies = (named ? args[1] : args[0]) as Array<string>;
    const declare = (named ? args[2] : args[1]) as ModuleDeclare;

    if (!id) {
      throw new Error('An anonymous module must be registered from a script with a URL.');
    }

    const record: ModuleRecord = {
      id,
      ...getPackageMetadata(id),
      dependencies,
      declare,
      namespace: {},
      importers: [],
      state: 'registered',
    };

    modules.set(id, record);
    registerRegistry[id] = true;
  }

  function resolve(id: string, parent?: string) {
    let result: string;

    if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(id)) {
      result = id;
    } else if (id.startsWith('.') && parent && /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(parent)) {
      result = new URL(id, parent).href;
    } else {
      result = modules.has(id) ? id : findMatchingPackage(modules, id) || id;
    }

    resolveListener?.(id, parent, result);
    return result;
  }

  function set(id: string, value: any) {
    const namespace = value && typeof value === 'object' ? value : { default: value };
    modules.set(id, {
      id,
      ...getPackageMetadata(id),
      dependencies: [],
      namespace,
      importers: [],
      state: 'evaluated',
    });
    registerRegistry[id] = true;
  }

  function registerFromSource(id: string, source: string) {
    registeringUrl = id;

    try {
      new Function('System', `${source}\n//# sourceURL=${id}`)(system);
    } finally {
      registeringUrl = undefined;
    }
  }

  async function loadScript(id: string): Promise<ModuleRecord> {
    const existing = modules.get(id);

    if (existing) {
      return existing;
    }

    const pending = loading.get(id);

    if (pending) {
      return pending;
    }

    const task = (async () => {
      if (typeof document !== 'undefined') {
        await new Promise<void>((resolveScript, rejectScript) => {
          const script = document.createElement('script');
          script.src = id;
          script.async = true;
          script.onload = () => resolveScript();
          script.onerror = () => rejectScript(new Error(`Failed to load module "${id}".`));
          document.head.appendChild(script);
        });
      } else {
        const response = await fetch(id);

        if (!response.ok) {
          throw new Error(`Failed to load module "${id}": ${response.status} ${response.statusText}`);
        }

        registerFromSource(id, await response.text());
      }

      const record = modules.get(id);

      if (!record) {
        throw new Error(`The script "${id}" did not register a module.`);
      }

      return record;
    })();

    loading.set(id, task);

    try {
      return await task;
    } finally {
      loading.delete(id);
    }
  }

  function instantiate(record: ModuleRecord): Promise<ModuleNamespace> {
    if (!record.evaluation) {
      record.evaluation = evaluate(record);
    }

    return record.evaluation;
  }

  function createsDependencyCycle(dependency: ModuleRecord, importer: ModuleRecord) {
    const visited = new Set<ModuleRecord>();
    let current: ModuleRecord | undefined = dependency;

    while (current && !visited.has(current)) {
      if (current === importer) {
        return true;
      }

      visited.add(current);
      current = current.waitingFor;
    }

    return false;
  }

  async function evaluate(record: ModuleRecord): Promise<ModuleNamespace> {
    if (record.state === 'evaluated') {
      return record.namespace;
    }

    if (record.state === 'failed') {
      throw record.error;
    }

    record.state = 'linking';

    const exportModule = ((nameOrValues: string | ModuleNamespace, value?: any) => {
      const updates = typeof nameOrValues === 'string' ? { [nameOrValues]: value } : nameOrValues;
      const changed = Object.entries(updates).some(
        ([name, exported]) =>
          !Object.prototype.hasOwnProperty.call(record.namespace, name) || !Object.is(record.namespace[name], exported),
      );
      Object.assign(record.namespace, updates);

      if (changed) {
        for (const importer of record.importers) {
          importer(record.namespace);
        }
      }

      return typeof nameOrValues === 'string' ? value : updates;
    }) as ModuleExport;

    const context: ModuleContext = {
      id: record.id,
      meta: { url: record.id },
      import: (id) => system.import(id, record.id),
      resolve: (id) => system.resolve(id, record.id),
    };

    try {
      record.declaration = record.declare?.(exportModule, context) || {};
      const setters = record.declaration.setters || [];

      for (let index = 0; index < record.dependencies.length; index++) {
        const dependencyId = resolve(record.dependencies[index], record.id);
        const dependency = await loadScript(dependencyId);
        const setter = setters[index];

        if (setter) {
          dependency.importers.push(setter);
        }

        record.waitingFor = dependency;
        const namespace = createsDependencyCycle(dependency, record) ? dependency.namespace : await instantiate(dependency);
        record.waitingFor = undefined;
        setter?.(namespace);
      }

      record.state = 'executing';
      await record.declaration.execute?.();
      record.state = 'evaluated';
      return record.namespace;
    } catch (error) {
      record.state = 'failed';
      record.error = error;
      throw error;
    } finally {
      record.waitingFor = undefined;
    }
  }

  const system: PicardSystem = {
    register,
    registerRegistry,
    set,
    get(id) {
      return modules.get(id)?.namespace;
    },
    has(id) {
      return modules.has(id);
    },
    entries() {
      return [...modules].map(([id, record]) => [id, record.namespace]);
    },
    list() {
      return [...modules.values()].flatMap((module) =>
        module.name && module.version ? [{ id: module.id, name: module.name, version: module.version }] : [],
      );
    },
    resolve,
    async import(id, parent) {
      const resolved = resolve(id, parent);
      const record = modules.get(resolved) || (await loadScript(resolved));
      return instantiate(record);
    },
    setResolveListener(listener) {
      resolveListener = listener;
    },
  };

  return system;
}
