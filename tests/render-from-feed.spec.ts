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
