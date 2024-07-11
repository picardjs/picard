import { test, expect } from '@playwright/test';
import { createServer } from 'http-server';
import { resolve } from 'path';

const port = 4327;
const address = `http://localhost:${port}/`;
const server = createServer({
  root: resolve(__dirname, '../examples/10-dependencies-sharing'),
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

test('the homepage is working', async ({ page }) => {
  await expect(page.locator('h1')).toHaveText('Dependency Sharing');
});

test('module federation from var is loaded', async ({ page }) => {
  await expect(page.locator('li:nth-child(1)')).toContainText('Hello from "test1": 🃏.');
});

test('module federation from esm is loaded', async ({ page }) => {
  await expect(page.locator('li:nth-child(2)')).toContainText('Hello from "test2": 🀄️.');
});

test('native federation with additional dependency is loaded', async ({ page }) => {
  await expect(page.locator('li:nth-child(3)')).toContainText('Hello from "test3": 🅿️.');
});

test('native federation directly is loaded', async ({ page }) => {
  await expect(page.locator('li:nth-child(4)')).toContainText('Hello from "test4": 🇨🇬.');
});

test('pilet is loaded', async ({ page }) => {
  await expect(page.locator('li:nth-child(5)')).toContainText('Hello from "test5": 🇩🇰.');
});

test('module federation v2 is loaded', async ({ page }) => {
  await expect(page.locator('li:nth-child(6)')).toContainText('Hello from "test6": 🀄️.');
});

test('triggering HTTP request from native federation works', async ({ page }) => {
  const dialogs: Array<string> = [];
  page.on('dialog', (dialog) => {
    dialogs.push(dialog.message());
    return dialog.accept();
  });
  await page.locator('li:nth-child(3) button').click();

  // unfortunately playwright has no support to wait for a dialog
  while (dialogs.length === 0) {
    await page.waitForTimeout(10);
  }

  expect(dialogs).toHaveLength(1);
});
