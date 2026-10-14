// Runs Lighthouse against the server-rendered examples and fails if a category drops below its threshold.
// Usage: npm run lighthouse [-- <example> ...]   (requires `npm run build` and `examples/prepare-all.sh`)
import { fork } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { connect } from 'node:net';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import puppeteer from 'puppeteer-core';
import { startFlow } from 'lighthouse';

const categories = ['performance', 'accessibility', 'best-practices', 'seo'];
const debuggingPort = 9333;
const reportDir = resolve(process.cwd(), 'lighthouse-report');

const targets = [
  { name: '16-ssr-islands', path: '/', port: 4470 },
  { name: '08-ssr-tractor', path: '/products', port: 4471 },
  { name: '11-ssr-native-tractor', path: '/products', port: 4472, execArgv: ['--experimental-vm-modules'] },
];

// all categories must be at 100
const threshold = 100;

async function waitForPort(port, timeout = 30000) {
  const end = Date.now() + timeout;

  while (Date.now() < end) {
    const ok = await new Promise((done) => {
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

function startServer({ name, port, execArgv = [] }) {
  const cwd = resolve(process.cwd(), 'examples', name, 'dist');
  return fork(resolve(cwd, 'server.js'), {
    cwd,
    execArgv,
    stdio: 'ignore',
    env: { ...process.env, PORT: `${port}` },
  });
}

async function measure(browser, url) {
  const page = await browser.newPage();

  try {
    const flow = await startFlow(page, {
      config: { extends: 'lighthouse:default', settings: { onlyCategories: categories } },
    });
    // the first connection to an origin may stall in some environments (e.g., WSL); open it with an uncached
    // request first - the measured navigation still starts with a cold cache, as no page resource was loaded
    await flow.navigate(new URL('/__lighthouse-warmup', url).href, { name: 'warmup' });
    await flow.navigate(url, { name: 'page', disableStorageReset: true });
    const { steps } = await flow.createFlowResult();
    const report = await flow.generateReport();
    return [steps[1].lhr, report];
  } finally {
    await page.close();
  }
}

function summarize(lhr) {
  const failures = [];

  for (const category of Object.values(lhr.categories)) {
    // only audits contributing to the score
    for (const { id } of category.auditRefs.filter((ref) => ref.weight > 0)) {
      const audit = lhr.audits[id];

      if (audit.score !== null && audit.score < 1) {
        failures.push(`${audit.title}${audit.displayValue ? ` (${audit.displayValue})` : ''}`);
      }
    }
  }

  return [...new Set(failures)];
}

const filter = process.argv.slice(2);
const selected = targets.filter((target) => !filter.length || filter.includes(target.name));
const launched = await chromium.launch({ args: [`--remote-debugging-port=${debuggingPort}`] });
const browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${debuggingPort}` });
let failed = false;

await mkdir(reportDir, { recursive: true });

try {
  for (const target of selected) {
    const server = startServer(target);

    try {
      await waitForPort(target.port);
      const [lhr, report] = await measure(browser, `http://localhost:${target.port}${target.path}`);
      const scores = categories.map((id) => [lhr.categories[id].title, Math.round(lhr.categories[id].score * 100)]);
      const passed = scores.every(([, score]) => score >= threshold);
      failed ||= !passed;
      await writeFile(resolve(reportDir, `${target.name}.html`), report, 'utf8');

      console.log(
        `${passed ? 'PASS' : 'FAIL'} ${target.name}: ${scores.map(([title, score]) => `${title} ${score}`).join(' | ')}`,
      );
      summarize(lhr).forEach((failure) => console.log(`     - ${failure}`));
    } finally {
      server.kill();
    }
  }
} finally {
  await browser.disconnect();
  await launched.close();
}

console.log(`Reports written to ${reportDir}`);
process.exitCode = failed ? 1 : 0;
