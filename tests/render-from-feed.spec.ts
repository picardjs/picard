import { test, expect } from '@playwright/test';
import { createServer } from 'http-server';
import { resolve } from 'path';

const port = 4322;
const address = `http://localhost:${port}/`;
const server = createServer({
  root: resolve(__dirname, '../examples/02-static-page-feed'),
});

test.beforeAll(({}) => {
  return new Promise<void>((resolve) => {
    server.listen(port, resolve);
  });
});

test.beforeEach(async ({ page }) => {
  await page.goto(address);
});

test.afterAll(() => {
  server.close();
});

test('has feed', async ({ page }) => {
  await expect(page.locator('script[feed]')).toHaveAttribute(
    'feed',
    'https://feed.piral.cloud/api/v1/microfrontends/picard-demos',
  );
});

test('has title', async ({ page }) => {
  await expect(page.locator('h1')).toHaveText('Hello World!');
});

test('three components', async ({ page }) => {
  expect(await page.locator('pi-component').count()).toBe(3);
});

test('loads module federation successfully', async ({ page }) => {
  await expect(page.getByText('Column 2')).toBeVisible();
});

test('loads native federation successfully', async ({ page }) => {
  await expect(page.getByText('Native Federation')).toBeVisible();
});

test('loads pilet successfully', async ({ page }) => {
  await expect(page.getByRole('button')).toHaveText('0x clicked');
});

test('does not intercept links without a router slot', async ({ page }) => {
  // wait until Picard.js is running
  await expect(page.getByRole('button')).toHaveText('0x clicked');
  await page.evaluate(() => {
    (window as any).__previousPage = true;
    const link = document.createElement('a');
    link.id = 'next-page';
    link.href = '/index.html?next';
    link.textContent = 'Next';
    document.body.appendChild(link);
  });
  await page.click('#next-page');
  await page.waitForURL('**/index.html?next');
  // the browser navigated, i.e., it's a new document
  await expect.poll(() => page.evaluate(() => (window as any).__previousPage)).toBeUndefined();
});

test('accepts objects and serialized JSON as data', async ({ page }) => {
  await expect(page.getByRole('button')).toHaveText('0x clicked');
  const attributes = await page.evaluate(() => {
    const component = document.querySelector('pi-component') as any;
    component.data = { start: 1 };
    const fromObject = component.getAttribute('data');
    // e.g., Svelte and Vue set the property with the value of the attribute
    component.data = '{"start":2}';
    const fromString = component.getAttribute('data');
    return [fromObject, fromString, component.data];
  });
  expect(attributes).toEqual(['{"start":1}', '{"start":2}', { start: 2 }]);
});

test('shares the share scope with the Module Federation runtime of the page', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as any;
    // the runtime of an application bundled with Module Federation
    w.__hostScope = {};
    w.__FEDERATION__ = { __INSTANCES__: [{ name: 'host', shareScopeMap: { default: w.__hostScope } }] };
    // records the share scope the container (mf-simple-html) is initialized with
    let container: any;
    Object.defineProperty(w, 'simplehtml', {
      configurable: true,
      get: () => container,
      set(value) {
        // the container's properties are getters only
        container = new Proxy(value, {
          get(target, key) {
            if (key === 'init') {
              return (scope: any, ...args: Array<any>) => {
                w.__initScope = scope;
                return target.init(scope, ...args);
              };
            }

            return target[key];
          },
        });
      },
    });
  });
  await page.goto(address);
  await expect(page.getByText('Column 2')).toBeVisible();
  // a container can only be initialized with a single share scope, so it must be the one of the page
  expect(await page.evaluate(() => (window as any).__initScope === (window as any).__hostScope)).toBe(true);
});

test('loads native federation with a CSP forbidding blob: scripts', async ({ page }) => {
  await page.route(address, async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: { ...response.headers(), 'content-security-policy': "script-src 'self' https://assets.piral.cloud" },
    });
  });
  await page.goto(address);
  await expect(page.getByText('Native Federation')).toBeVisible();
});
