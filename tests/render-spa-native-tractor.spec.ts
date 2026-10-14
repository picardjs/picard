import { test, expect } from '@playwright/test';
import { createServer } from 'http-server';
import { resolve } from 'path';

const port = 4329;
const address = `http://localhost:${port}/`;
const server = createServer({
  root: resolve(__dirname, '../examples/12-spa-native-tractor'),
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
  await expect(page.locator('#basket')).toHaveText('basket: 0 item(s)');
  await page.click('#buy button');
  await expect(page.locator('#basket')).toHaveText('basket: 1 item(s)');
});

test('can switch tractor - switches buy-button', async ({ page }) => {
  await expect(page.locator('#buy button')).toHaveText('buy for 66,00 €');
  await page.click('#options > button:nth-child(2)');
  await expect(page.locator('#buy button')).toHaveText('buy for 54,00 €');
  await page.click('#options > button:nth-child(3)');
  await expect(page.locator('#buy button')).toHaveText('buy for 58,00 €');
  await page.click('#options > button:nth-child(1)');
  await expect(page.locator('#buy button')).toHaveText('buy for 66,00 €');
});

test('can switch tractor - switches recommendation', async ({ page }) => {
  await expect(page.locator('#buy button')).toHaveText('buy for 66,00 €');
  
  const redLocs = page.locator('.green-recos > img');
  await expect(redLocs).toHaveCount(3);
  await expect(redLocs.nth(0)).toHaveAttribute('alt', 'Recommendation 3');
  await expect(redLocs.nth(1)).toHaveAttribute('alt', 'Recommendation 5');
  await expect(redLocs.nth(2)).toHaveAttribute('alt', 'Recommendation 6');

  await page.click('#options > button:nth-child(2)');

  const greenLocs = page.locator('.green-recos > img');
  await expect(greenLocs).toHaveCount(3);
  await expect(greenLocs.nth(0)).toHaveAttribute('alt', 'Recommendation 3');
  await expect(greenLocs.nth(1)).toHaveAttribute('alt', 'Recommendation 6');
  await expect(greenLocs.nth(2)).toHaveAttribute('alt', 'Recommendation 4');

  await page.click('#options > button:nth-child(3)');

  const blueLocs = page.locator('.green-recos > img');
  await expect(blueLocs).toHaveCount(3);
  await expect(blueLocs.nth(0)).toHaveAttribute('alt', 'Recommendation 1');
  await expect(blueLocs.nth(1)).toHaveAttribute('alt', 'Recommendation 8');
  await expect(blueLocs.nth(2)).toHaveAttribute('alt', 'Recommendation 7');

  await page.click('#options > button:nth-child(1)');
});
