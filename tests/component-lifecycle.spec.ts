import { test, expect } from '@playwright/test';
import { createServer } from 'http-server';
import { resolve } from 'path';

const port = 4331;
const address = `http://localhost:${port}/`;
const server = createServer({
  root: resolve(__dirname, '../examples/15-component-capabilities'),
});

test.beforeAll(({}) => {
  return new Promise<void>((resolve) => {
    server.listen(port, resolve);
  });
});

test.afterAll(() => {
  server.close();
});

test('does not activate an idle component after it is disconnected', async ({ page }) => {
  await page.addInitScript(() => {
    let pendingCallback: IdleRequestCallback | undefined;
    (window as any).__runPendingIdle = () => pendingCallback?.();
    window.requestIdleCallback = (callback: IdleRequestCallback) => {
      pendingCallback = callback;
      return 1;
    };
    window.cancelIdleCallback = () => {};
  });

  await page.goto(address);
  await page.locator('#idle pi-component').evaluate((element) => {
    const template = document.createElement('template');
    template.id = 'deferred-loading-template';
    template.innerHTML = '<span>Loading</span>';
    document.body.appendChild(template);

    element.setAttribute('loading-template-id', template.id);
    (window as any).__deferredComponent = element;
    element.remove();
  });

  await page.evaluate(() => (window as any).__runPendingIdle());
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );

  const hasChildren = await page.evaluate(() => (window as any).__deferredComponent.hasChildNodes());
  expect(hasChildren).toBe(false);
});