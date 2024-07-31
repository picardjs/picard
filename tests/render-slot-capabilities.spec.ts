import { test, expect } from '@playwright/test';
import { createServer } from 'http-server';
import { resolve } from 'path';

const port = 4330;
const address = `http://localhost:${port}/`;
const server = createServer({
  root: resolve(__dirname, '../examples/14-slot-capabilities'),
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

test('can render capabilities page', async ({ page }) => {
  await expect(page.locator('h1')).toHaveText('Hello World!');
});

test('renders all items without any other instruction', async ({ page }) => {
  const locator = page.locator('#no-attributes pi-component');
  await expect(locator).toHaveCount(3);
  await expect(locator.nth(0)).toHaveText('From ONE!');
  await expect(locator.nth(1)).toHaveText('From TWO!');
  await expect(locator.nth(2)).toHaveText('From THREE!');
});

test('renders all items with wrapping in a template', async ({ page }) => {
  const locator = page.locator('#in-template .col-sm-4 > pi-component');
  await expect(locator).toHaveCount(3);
  await expect(locator.nth(0)).toHaveText('From ONE!');
  await expect(locator.nth(1)).toHaveText('From TWO!');
  await expect(locator.nth(2)).toHaveText('From THREE!');
});

test('renders all items with reverse order', async ({ page }) => {
  const locator = page.locator('#reverse-order .col-sm-4 > pi-component');
  await expect(locator).toHaveCount(3);
  await expect(locator.nth(0)).toHaveText('From THREE!');
  await expect(locator.nth(1)).toHaveText('From TWO!');
  await expect(locator.nth(2)).toHaveText('From ONE!');
});

test('renders all items with ordering by its CID', async ({ page }) => {
  const locator = page.locator('#order-by-cid .col-sm-4 > pi-component');
  await expect(locator).toHaveCount(3);
  const result = await page.evaluate(() => {
    // @ts-ignore
    return picard.readState().components.component.sort((a, b) => a.id.localeCompare(b.id));
  });
  await expect(locator.nth(0)).toHaveAttribute('cid', result[0].id);
  await expect(locator.nth(1)).toHaveAttribute('cid', result[1].id);
  await expect(locator.nth(2)).toHaveAttribute('cid', result[2].id);
});

test('renders all items with ordering by the MF name', async ({ page }) => {
  const locator = page.locator('#order-by-origin .col-sm-4 > pi-component');
  await expect(locator).toHaveCount(3);
  await expect(locator.nth(0)).toHaveText('From ONE!');
  await expect(locator.nth(1)).toHaveText('From THREE!');
  await expect(locator.nth(2)).toHaveText('From TWO!');
});

test('renders all items with ordering by the MF name in reverse', async ({ page }) => {
  const locator = page.locator('#reverse-order-by-origin .col-sm-4 > pi-component');
  await expect(locator).toHaveCount(3);
  await expect(locator.nth(2)).toHaveText('From ONE!');
  await expect(locator.nth(1)).toHaveText('From THREE!');
  await expect(locator.nth(0)).toHaveText('From TWO!');
});
