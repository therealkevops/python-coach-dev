import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseChallenge } from '../src/content/parse.js';
import { loadCatalog, ROOT } from './helpers.js';

const catalog = loadCatalog();

test('every track has challenges, numbered in order', () => {
  for (const track of catalog.tracks) {
    assert.ok(track.challenges.length > 0, `${track.id} has no challenges`);
    track.challenges.forEach((c, i) => assert.equal(c.code, `${track.index}.${String(i + 1).padStart(2, '0')}`, `${c.id} numbering`));
  }
});

test('every challenge has the fields the app relies on', () => {
  for (const c of catalog.order) {
    assert.ok(c.title && c.lesson.length > 100, `${c.id}: title and lesson`);
    assert.ok([1, 2, 3].includes(c.difficulty), `${c.id}: difficulty is 1-3`);
    assert.ok(c.concepts.length > 0, `${c.id}: concepts`);
    assert.ok(c.hints.length > 0, `${c.id}: hints`);
    assert.ok(/^(async )?def test_/m.test(c.tests), `${c.id}: tests define test_ functions`);
    assert.notEqual(c.starter.trim(), c.solution.trim(), `${c.id}: starter differs from solution`);
    assert.ok(c.lesson.includes('### Task'), `${c.id}: lesson has a Task section`);
  }
});

test('challenge ids are unique', () => {
  assert.equal(new Set(catalog.order.map((c) => c.id)).size, catalog.order.length);
});

test('packages a challenge imports are declared in its front matter', () => {
  for (const c of catalog.order) {
    if (/\bpydantic\b/.test(c.solution)) assert.ok(c.packages.includes('pydantic'), `${c.id}: declare packages: pydantic`);
  }
});

test('parseChallenge strips quotes and reports missing sections', () => {
  const text = readFileSync(join(ROOT, 'content/06-agents/05-capstone-agent.md'), 'utf8');
  assert.equal(parseChallenge(text).title, 'Capstone: an Agent class');
  assert.throws(() => parseChallenge('---\ntitle: x\ndifficulty: 1\n---\n## Lesson\nhi\n'), /missing sections/);
  assert.throws(() => parseChallenge('no front matter'), /front matter/);
});
