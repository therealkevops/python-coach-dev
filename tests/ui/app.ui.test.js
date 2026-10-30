// End-to-end tests in headless Chromium against the production build (npm run test:ui).
// They load real Pyodide from the CDN, so they need network access.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { loadCatalog } from '../helpers.js';

const PORT = 8997;
const BASE = `http://127.0.0.1:${PORT}/`;
const PYTHON_READY_MS = 120_000;
const catalog = loadCatalog();
let server, browser;

before(async () => {
  server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { stdio: 'pipe' });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('vite preview did not start')), 30_000);
    server.stdout.on('data', (d) => { if (String(d).includes(String(PORT))) { clearTimeout(timer); resolve(); } });
  });
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  browser = await chromium.launch(proxy ? { proxy: { server: proxy, bypass: '127.0.0.1,localhost' } } : {});
});

after(async () => {
  await browser?.close();
  server?.kill();
});

async function openPage(storage) {
  const context = await browser.newContext();
  if (storage) {
    await context.addInitScript((value) => {
      if (!sessionStorage.getItem('seeded')) {
        localStorage.setItem('pycoach:v1', value);
        sessionStorage.setItem('seeded', '1');
      }
    }, JSON.stringify(storage));
  }
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return { page, context, errors };
}

async function check(page) {
  await page.getByRole('button', { name: 'Check' }).click();
  await page.locator('.console-body .summary, .console-body .error-box').first().waitFor({ timeout: PYTHON_READY_MS });
  return page.locator('.console-body').innerText();
}

test('the path page lists every track and challenge', async () => {
  const { page, context, errors } = await openPage();
  await page.goto(BASE);
  await page.getByRole('heading', { name: /Python basics/ }).waitFor();
  assert.equal(await page.locator('table.grid tbody tr').count(), catalog.order.length);
  assert.deepEqual(errors, []);
  await context.close();
});

test('typing a solution into the editor and checking it', async () => {
  const { page, context, errors } = await openPage();
  await page.goto(`${BASE}#/c/basics/print`);
  await page.locator('.topbar .runtime-ready').waitFor({ timeout: PYTHON_READY_MS });

  const first = await check(page);
  assert.match(first, /0\/3 passed|1\/3 passed/);

  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('Delete');
  // closeBrackets would double typed quotes and brackets, so insert the text directly.
  await page.keyboard.insertText('print("Hello, agent!")\nprint("Ready.")\n');
  const second = await check(page);
  assert.match(second, /3\/3 passed/);
  assert.match(second, /\+10 xp/);

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('pycoach:v1')));
  assert.equal(stored.entries['basics/print'].status, 'passed');
  assert.ok(stored.entries['basics/print'].review.due > Date.now());
  assert.deepEqual(errors, []);
  await context.close();
});

test('every reference solution passes in the browser runtime', { timeout: 15 * 60_000 }, async () => {
  const entries = Object.fromEntries(catalog.order.map((c) => [c.id, { status: 'new', checks: 0, hintsShown: 0, solutionViewed: false, xp: 0, code: c.solution }]));
  const { page, context, errors } = await openPage({ version: 1, entries, settings: {}, lastChallenge: null });
  await page.goto(BASE);
  const failures = [];
  for (const c of catalog.order) {
    await page.goto(`${BASE}#/c/${c.id}`);
    await page.locator('.lesson-head h1', { hasText: c.title }).waitFor();
    const text = await check(page);
    const m = text.match(/(\d+)\/(\d+) passed/);
    if (!m || m[1] !== m[2]) failures.push(`${c.id}: ${text.slice(0, 400)}`);
  }
  assert.deepEqual(failures, []);
  assert.deepEqual(errors, []);
  await context.close();
});

test('an infinite loop is stopped and Python restarts', { timeout: 5 * 60_000 }, async () => {
  const entries = { 'basics/while': { status: 'new', checks: 0, hintsShown: 0, solutionViewed: false, xp: 0, code: 'while True:\n    pass\n' } };
  const { page, context } = await openPage({ version: 1, entries, settings: {}, lastChallenge: null });
  await page.goto(`${BASE}#/c/basics/while`);
  await page.locator('.topbar .runtime-ready').waitFor({ timeout: PYTHON_READY_MS });
  const text = await check(page);
  assert.match(text, /Stopped after 12s/);
  await page.locator('.topbar .runtime-ready').waitFor({ timeout: PYTHON_READY_MS });
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('Delete');
  await page.keyboard.insertText(catalog.byId.get('basics/while').solution);
  assert.match(await check(page), /5\/5 passed/);
  await context.close();
});
