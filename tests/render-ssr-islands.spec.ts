import { test, expect, Request } from '@playwright/test';
import { ChildProcess, fork } from 'child_process';
import { resolve } from 'path';
import { connect } from 'net';

async function waitForPort(port: number, timeout = 30000) {
  const end = Date.now() + timeout;

  while (Date.now() < end) {
    const ok = await new Promise<boolean>((done) => {
      const socket = connect(port, 'localhost');
      socket.once('connect', () => (socket.destroy(), done(true)));
      socket.once('error', () => (socket.destroy(), done(false)));
    });

    if (ok) {
      return;
    }

    await new Promise((r) => setTimeout(r, 100));
  }

  throw new Error(`Server on port ${port} did not start in time.`);
}

const port = 4332;
const address = `http://localhost:${port}/`;
const child = {
  current: undefined as ChildProcess | undefined,
};

test.beforeAll(async ({}) => {
  const cwd = resolve(__dirname, '../examples/16-ssr-islands/dist');
  const fn = resolve(cwd, 'server.js');

  child.current = fork(fn, {
    cwd,
    env: {
      PORT: `${port}`,
    },
  });

  await waitForPort(port);
});

test.afterAll(() => {
  child.current?.kill();
});

test('marks server-rendered components for hydration', async ({ request }) => {
  const res = await request.get(address);
  const html = await res.text();

  // the client is only loaded after the first paint
  expect(html).toContain('<script type="module">requestAnimationFrame(()=>setTimeout(()=>import("/picard/picard.js")))</script>');
  expect(html).toMatch(/<pi-component [^>]*data="{&quot;start&quot;:5}" hydrate><button[^>]*>Count: 5<\/button>/);
  expect(html).toMatch(/<pi-component [^>]*server="none"><\/pi-component>/);
});

test('hydrates server-rendered components', async ({ page }) => {
  await page.goto(address);
  const component = page.locator('#counter pi-component');
  await expect(component).toHaveAttribute('data-mode', 'hydrated');
  // the markup from the server is kept
  await expect(component.locator('.origin')).toHaveText('server');
  await component.locator('button').click();
  await expect(component.locator('button')).toHaveText('Count: 6');
});

test('keeps hydrated components when moved', async ({ page }) => {
  await page.goto(address);
  const component = page.locator('#counter pi-component');
  await expect(component).toHaveAttribute('data-mode', 'hydrated');
  // e.g., streamed rendering moves elements from a hidden container into place
  await page.evaluate(() => {
    const target = document.createElement('div');
    target.id = 'moved';
    document.body.appendChild(target);
    target.appendChild(document.querySelector('#counter pi-component')!);
  });
  const moved = page.locator('#moved pi-component');
  await expect(moved).toHaveAttribute('data-mode', 'hydrated');
  await expect(moved.locator('.origin')).toHaveText('server');
  await moved.locator('button').click();
  await expect(moved.locator('button')).toHaveText('Count: 6');
});

test('renders client-only components on the client', async ({ page }) => {
  await page.goto(address);
  const component = page.locator('#client-only pi-component');
  await expect(component).toHaveAttribute('data-mode', 'rendered');
  await expect(component.locator('.origin')).toHaveText('client');
  await component.locator('button').click();
  await expect(component.locator('button')).toHaveText('Count: 1');
});

test('keeps server-only components static', async ({ page }) => {
  await page.goto(address);
  await expect(page.locator('#counter pi-component')).toHaveAttribute('data-mode', 'hydrated');
  const component = page.locator('#server-only pi-component');
  await expect(component.locator('.origin')).toHaveText('server');
  await component.locator('button').click();
  await expect(component.locator('button')).toHaveText('Count: 0');
  await expect(component).not.toHaveAttribute('data-mode');
});

test('hydrates components once visible', async ({ page }) => {
  await page.goto(address);
  await expect(page.locator('#counter pi-component')).toHaveAttribute('data-mode', 'hydrated');
  const component = page.locator('#visible pi-component');
  await expect(component).not.toHaveAttribute('data-mode');
  await component.scrollIntoViewIfNeeded();
  await expect(component).toHaveAttribute('data-mode', 'hydrated');
  await expect(component.locator('.origin')).toHaveText('server');
  await component.locator('button').click();
  await expect(component.locator('button')).toHaveText('Count: 1');
});

test('resumes without feed, fragments, or Module Federation runtime', async ({ page }) => {
  const requests: Array<Request> = [];
  const errors: Array<string> = [];
  page.on('request', (req) => requests.push(req));
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto(address);
  await expect(page.locator('#counter pi-component')).toHaveAttribute('data-mode', 'hydrated');

  const paths = requests.map((req) => new URL(req.url()).pathname);
  expect(paths).toContain('/picard/picard.js');
  expect(paths).toContain('/client/vanilla.js');
  expect(paths).toContain('/pilets/demo/index.js');
  expect(paths).not.toContain('/feed.json');
  expect(paths.filter((path) => path.startsWith('/fragment'))).toEqual([]);
  expect(paths.filter((path) => /\/module-[^/]+\.js$/.test(path))).toEqual([]);
  expect(errors).toEqual([]);
});
