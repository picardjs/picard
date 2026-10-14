import { test, expect } from '@playwright/test';
import { createSystem } from '../src/common/loader/system';

test('resolves and executes relative System.register dependencies', async () => {
  const system = createSystem();
  const dependencyUrl = 'https://picard.test/pilet/dependency.js';
  const entryUrl = 'https://picard.test/pilet/index.js';

  system.register(dependencyUrl, [], (exportModule) => ({
    execute() {
      exportModule('value', 42);
    },
  }));
  system.register(entryUrl, ['./dependency.js'], (exportModule) => {
    let dependency: Record<string, any>;

    return {
      setters: [(module) => (dependency = module)],
      execute() {
        exportModule('result', dependency.value);
      },
    };
  });

  await expect(system.import(entryUrl)).resolves.toEqual({ result: 42 });
});

test('notifies dependent setters when an export changes', async () => {
  const system = createSystem();
  const dependencyUrl = 'https://picard.test/dependency.js';
  const entryUrl = 'https://picard.test/index.js';
  const observed: Array<number> = [];

  system.register(dependencyUrl, [], (exportModule) => ({
    execute() {
      exportModule('value', 1);
      exportModule('value', 2);
    },
  }));
  system.register(entryUrl, [dependencyUrl], () => ({
    setters: [(module) => observed.push(module.value)],
  }));

  await system.import(entryUrl);

  expect(observed).toContain(1);
  expect(observed).toContain(2);
});

test('gets an already registered module synchronously', async () => {
  const system = createSystem();
  const moduleUrl = 'https://picard.test/react.js';
  system.set(moduleUrl, { createElement: () => undefined });

  expect(system.get(moduleUrl)).toEqual({ createElement: expect.any(Function) });
});

test('stores package name and version separately from a scoped module ID', () => {
  const system = createSystem();
  system.register('@scope/react@19.0.0', [], () => ({}));

  expect(system.list()).toEqual([{ id: '@scope/react@19.0.0', name: '@scope/react', version: '19.0.0' }]);
});

test('imports the exact version selected by the package resolver', async () => {
  const system = createSystem();
  system.register('react@18.0.0', [], (exportModule) => ({
    execute() {
      exportModule('selected', 'registered');
    },
  }));
  system.register('react@18.2.0', [], (exportModule) => ({
    execute() {
      exportModule('selected', 'evaluated');
    },
  }));

  system.setPackageResolver(async (name, range) => {
    expect(name).toBe('react');
    expect(range).toBe('^18.0.0');
    return 'react@18.2.0';
  });

  await expect(system.import('react@^18.0.0')).resolves.toEqual({ selected: 'evaluated' });
});

test('preserves exact registered IDs before range matching', () => {
  const system = createSystem();
  system.set('react@18.0.0', {});
  system.set('react@18.2.0', {});

  expect(system.resolve('react@18.2.0')).toBe('react@18.2.0');
});

test('delegates versioned dependencies to the package resolver', async () => {
  const system = createSystem();
  const resolutions: Array<[string, string, string | undefined]> = [];
  system.setPackageResolver(async (name, range, parent) => {
    resolutions.push([name, range, parent]);
    system.set('react@18.2.0', { version: '18.2.0' });
    return 'react@18.2.0';
  });
  system.register('https://picard.test/pilet.js', ['react@^18.0.0'], (exportModule) => {
    let react: Record<string, any>;

    return {
      setters: [(module) => (react = module)],
      execute() {
        exportModule('selectedVersion', react.version);
      },
    };
  });

  await expect(system.import('https://picard.test/pilet.js')).resolves.toEqual({ selectedVersion: '18.2.0' });
  expect(resolutions).toEqual([['react', '^18.0.0', 'https://picard.test/pilet.js']]);
});

test('does not delegate exact registered package IDs', async () => {
  const system = createSystem();
  let resolverCalls = 0;
  system.setPackageResolver(async () => {
    resolverCalls++;
    return undefined;
  });
  system.register('react@18.2.0', [], (exportModule) => ({
    execute() {
      exportModule('version', '18.2.0');
    },
  }));

  await expect(system.import('react@18.2.0')).resolves.toEqual({ version: '18.2.0' });
  expect(resolverCalls).toBe(0);
});

test('rechecks package resolution after the available version state changes', async () => {
  const system = createSystem();
  let selectedId = 'library@1.0.0';
  system.setPackageResolver(async () => selectedId);
  system.register('library@1.0.0', [], (exportModule) => ({
    execute() {
      exportModule('version', '1.0.0');
    },
  }));
  system.register('library@1.1.0', [], (exportModule) => ({
    execute() {
      exportModule('version', '1.1.0');
    },
  }));

  await expect(system.import('library@^1.0.0')).resolves.toEqual({ version: '1.0.0' });
  selectedId = 'library@1.1.0';
  await expect(system.import('library@^1.0.0')).resolves.toEqual({ version: '1.1.0' });
});

test('lists package metadata from set without treating URLs or ranges as package versions', () => {
  const system = createSystem();
  system.set('react@19.0.0', {});
  system.set('https://picard.test/react@19.0.0', {});
  system.set('react@^19.0.0', {});
  system.set('unversioned', {});

  expect(system.list()).toEqual([{ id: 'react@19.0.0', name: 'react', version: '19.0.0' }]);
  expect(system.resolve('react@^19.0.0')).toBe('react@^19.0.0');
});

test('loads anonymous register modules and relative dependencies in Node', async () => {
  const system = createSystem();
  const entryUrl = 'https://picard.test/pilet/index.js';
  const dependencyUrl = 'https://picard.test/pilet/dependency.js';
  const originalFetch = globalThis.fetch;
  const sources: Record<string, string> = {
    [entryUrl]: `System.register(["./dependency.js"], function (_export) {
      var dependency;
      return {
        setters: [function (module) { dependency = module; }],
        execute: function () { _export("result", dependency.value); }
      };
    });`,
    [dependencyUrl]: `System.register([], function (_export) {
      return { execute: function () { _export("value", 42); } };
    });`,
  };

  globalThis.fetch = async (input) => new Response(sources[String(input)], { status: 200 });

  try {
    await expect(system.import(entryUrl)).resolves.toEqual({ result: 42 });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('concurrent imports wait for the same async module evaluation', async () => {
  const system = createSystem();
  let finishExecution!: () => void;
  const gate = new Promise<void>((resolve) => (finishExecution = resolve));
  let executions = 0;
  system.register('async-module', [], (exportModule) => ({
    async execute() {
      executions++;
      await gate;
      exportModule('ready', true);
    },
  }));

  const first = system.import('async-module');
  let secondCompleted = false;
  const second = system.import('async-module').then((module) => {
    secondCompleted = true;
    return module;
  });
  await new Promise<void>((resolve) => setImmediate(resolve));
  const completedBeforeExecution = secondCompleted;
  finishExecution();

  await expect(first).resolves.toEqual({ ready: true });
  await expect(second).resolves.toEqual({ ready: true });
  expect(completedBeforeExecution).toBe(false);
  expect(executions).toBe(1);
});

test('links a circular dependency without waiting for its own evaluation', async () => {
  const system = createSystem();
  system.register('first', ['second'], (exportModule) => {
    exportModule('name', 'first');
    return { setters: [(module) => exportModule('dependency', module.name)] };
  });
  system.register('second', ['first'], (exportModule) => {
    exportModule('name', 'second');
    return { setters: [(module) => exportModule('dependency', module.name)] };
  });

  await expect(Promise.all([system.import('first'), system.import('second')])).resolves.toEqual([
    { name: 'first', dependency: 'second' },
    { name: 'second', dependency: 'first' },
  ]);
});