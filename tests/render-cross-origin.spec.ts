import { test, expect } from '@playwright/test';
import { createServer } from 'http-server';
import { createServer as createPageServer } from 'http';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// the page and the script are served from different origins (ports), e.g., like using a CDN
const pagePort = 4333;
const scriptPort = 4334;
const address = `http://localhost:${pagePort}/`;
const scriptUrl = `http://localhost:${scriptPort}/picard.js`;
// reference the script without a "crossorigin" attribute
const page = readFileSync(resolve(__dirname, '../examples/01-static-page/index.html'), 'utf8').replace(
  './dist/picard.js',
  scriptUrl,
);
const pageServer = createPageServer((_req, res) => {
  res.writeHead(200, { 'content-type': 'text/html' });
  res.end(page);
});
const scriptServer = createServer({
  root: resolve(__dirname, '../dist/browser'),
  cors: true,
});

test.beforeAll(() => {
  return Promise.all([
    new Promise<void>((resolve) => pageServer.listen(pagePort, () => resolve())),
    new Promise<void>((resolve) => scriptServer.listen(scriptPort, resolve)),
  ]);
});

test.beforeEach(async ({ page }) => {
  await page.goto(address);
});

test.afterAll(() => {
  pageServer.close();
  scriptServer.close();
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

test('does not leak into the global scope', async ({ page }) => {
  await expect(page.getByRole('button')).toHaveText('0x clicked');
  const globals = await page.evaluate(() => {
    // compare with the globals of a blank document
    const frame = document.body.appendChild(document.createElement('iframe'));
    const known = new Set(Object.keys(frame.contentWindow!));
    frame.remove();
    return Object.keys(window).filter((key) => !known.has(key));
  });
  // minified top-level names of the script must not become globals
  expect(globals.filter((key) => /^[a-z_$][\w$]{0,2}$/i.test(key))).toEqual([]);
  expect(globals).toContain('picard');
});
