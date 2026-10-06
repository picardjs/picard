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