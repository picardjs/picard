import { test, expect } from '@playwright/test';
import { createServer } from 'http-server';
import { resolve } from 'path';

const port = 4325;
const address = `http://localhost:${port}/`;
const server = createServer({
  root: resolve(__dirname, '../examples/06-static-page-single-spa'),
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

test('can render product page', async ({ page }) => {
  await expect(page.locator('h1')).toHaveText('The Model Store');
});

test('can buy tractor', async ({ page }) => {
  await expect(page.locator('#basket')).toHaveText('Basket: 0 item(s)');
  await page.click('button');
  await expect(page.locator('#basket')).toHaveText('Basket: 1 item(s)');
});

test('used purple MF fallback', async ({ page }) => {
  await expect(page.locator('pi-component[name="Reviews"]')).toHaveText(
    'The reviews module is currently not available.',
  );
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
  const redLocs = page.locator('.green-recos > img');
  await expect(redLocs).toHaveCount(3);
  await expect(redLocs.nth(0)).toHaveAttribute('alt', 'Recommendation 3');
  await expect(redLocs.nth(1)).toHaveAttribute('alt', 'Recommendation 5');
  await expect(redLocs.nth(2)).toHaveAttribute('alt', 'Recommendation 6');

  await page.click('#options > a:nth-child(2)');

  const greenLocs = page.locator('.green-recos > img');
  await expect(greenLocs).toHaveCount(3);
  await expect(greenLocs.nth(0)).toHaveAttribute('alt', 'Recommendation 3');
  await expect(greenLocs.nth(1)).toHaveAttribute('alt', 'Recommendation 6');
  await expect(greenLocs.nth(2)).toHaveAttribute('alt', 'Recommendation 4');

  await page.click('#options > a:nth-child(3)');

  const blueLocs = page.locator('.green-recos > img');
  await expect(blueLocs).toHaveCount(3);
  await expect(blueLocs.nth(0)).toHaveAttribute('alt', 'Recommendation 1');
  await expect(blueLocs.nth(1)).toHaveAttribute('alt', 'Recommendation 8');
  await expect(blueLocs.nth(2)).toHaveAttribute('alt', 'Recommendation 7');

  await page.click('#options > a:nth-child(1)');
});
