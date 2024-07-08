import { test, expect } from '@playwright/test';
import { ChildProcess, fork } from 'child_process';
import { resolve } from 'path';

const port = 4326;
const address = `http://localhost:${port}/`;
const child = {
  current: undefined as ChildProcess | undefined,
};

test.beforeAll(({}) => {
  const cwd = resolve(__dirname, '../examples/08-ssr-tractor/dist');
  const fn = resolve(cwd, 'server.js');

  return new Promise<void>((resolve) => {
    child.current = fork(fn, {
      cwd,
      env: {
        PORT: `${port}`,
      },
    });

    setTimeout(resolve, 100);
  });
});

test.beforeEach(async ({ page }) => {
  await page.goto(address);
});

test.afterAll(() => {
  child.current?.kill();
});

test('can render product page', async ({ page }) => {
  await expect(page.locator('h1')).toHaveText('The Model Store');
});

test('can buy tractor', async ({ page }) => {
  await expect(page.locator('#basket')).toHaveText('basket: 0 item(s)');
  await page.click('button');
  await expect(page.locator('#basket')).toHaveText('basket: 1 item(s)');
});

test('can switch tractor - switches buy-button', async ({ page }) => {
  await expect(page.locator('button')).toHaveText('buy for 66,00 €');
  await page.click('#options > a:nth-child(2)');
  await expect(page.locator('button')).toHaveText('buy for 54,00 €');
  await page.click('#options > a:nth-child(3)');
  await expect(page.locator('button')).toHaveText('buy for 58,00 €');
  await page.click('#options > a:nth-child(1)');
  await expect(page.locator('button')).toHaveText('buy for 66,00 €');
});

test('can switch tractor - switches recommendation', async ({ page }) => {
  const redLocs = await page.locator('.green-recos > img').all();
  expect(redLocs.length).toBe(3);
  await expect(redLocs[0]).toHaveAttribute('alt', 'Recommendation 3');
  await expect(redLocs[1]).toHaveAttribute('alt', 'Recommendation 5');
  await expect(redLocs[2]).toHaveAttribute('alt', 'Recommendation 6');

  await page.click('#options > a:nth-child(2)');

  const greenLocs = await page.locator('.green-recos > img').all();
  expect(greenLocs.length).toBe(3);
  await expect(greenLocs[0]).toHaveAttribute('alt', 'Recommendation 3');
  await expect(greenLocs[1]).toHaveAttribute('alt', 'Recommendation 6');
  await expect(greenLocs[2]).toHaveAttribute('alt', 'Recommendation 4');

  await page.click('#options > a:nth-child(3)');

  const blueLocs = await page.locator('.green-recos > img').all();
  expect(blueLocs.length).toBe(3);
  await expect(blueLocs[0]).toHaveAttribute('alt', 'Recommendation 1');
  await expect(blueLocs[1]).toHaveAttribute('alt', 'Recommendation 8');
  await expect(blueLocs[2]).toHaveAttribute('alt', 'Recommendation 7');

  await page.click('#options > a:nth-child(1)');
});
