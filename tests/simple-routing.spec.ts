import { test, expect } from '@playwright/test';
import { createServer } from 'http-server';
import { resolve } from 'path';

const port = 4324;
const address = `http://localhost:${port}/`;
const server = createServer({
  root: resolve(__dirname, '../examples/05-static-page-with-routing'),
});

test.beforeAll(({  }) => {
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

test('is initially on home page', async ({ page }) => {
  await expect(page.locator('pi-slot')).toHaveAttribute('name', 'page:/');
  await expect(page.locator('h1')).toHaveText('Hello World!');
});

test('can navigate to about page and back', async ({ page }) => {
  await page.click('a[href="/about"]');
  await expect(page.locator('pi-slot')).toHaveAttribute('name', 'page:/about');
  await expect(page.locator('h1')).toHaveText('About Page!');
  await page.click('a[href="/"]');
  await expect(page.locator('pi-slot')).toHaveAttribute('name', 'page:/');
});

test('can change web component', async ({ page }) => {
  await expect(page.locator('h1')).toHaveText('Hello World!');
  await page.locator('pi-slot').evaluate(el => el.setAttribute('name', 'page:/about'));
  await expect(page.locator('h1')).toHaveText('About Page!');
  await page.locator('pi-slot').evaluate(el => el.setAttribute('name', 'page:/'));
  await expect(page.locator('h1')).toHaveText('Hello World!');
});
