import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DAY, REVIEW_INTERVALS, computeXp, recordCheck, scheduleReview, dueReviews, nextChallenge,
  summarize, streakDays, formatDue, emptyEntry,
} from '../src/state/progress.js';

const NOW = Date.UTC(2026, 9, 30, 12);

test('XP: 10 per difficulty level, a quarter off per hint, floor of a quarter, none with the solution', () => {
  assert.equal(computeXp(2, 0, false), 20);
  assert.equal(computeXp(2, 1, false), 15);
  assert.equal(computeXp(2, 3, false), 5);
  assert.equal(computeXp(2, 9, false), 5);
  assert.equal(computeXp(3, 0, true), 0);
});

test('a failed check marks a new challenge attempted and counts the check', () => {
  const e = recordCheck(undefined, { passed: false, difficulty: 1, now: NOW });
  assert.equal(e.status, 'attempted');
  assert.equal(e.checks, 1);
  assert.equal(e.review, null);
});

test('a first pass awards XP once and schedules the first review', () => {
  const start = { ...emptyEntry(), hintsShown: 1 };
  const first = recordCheck(start, { passed: true, difficulty: 2, now: NOW });
  assert.equal(first.status, 'passed');
  assert.equal(first.xp, 15);
  assert.equal(first.firstPassAt, NOW);
  assert.deepEqual(first.review, { level: 0, due: NOW + REVIEW_INTERVALS[0] * DAY });
  const again = recordCheck(first, { passed: true, difficulty: 2, now: NOW + 1000 });
  assert.equal(again.xp, 15, 'passing again changes nothing');
  assert.deepEqual(again.review, first.review, 'a normal re-check does not move the review');
});

test('clean reviews climb the intervals; assisted reviews reset them', () => {
  assert.deepEqual(scheduleReview({ level: 1, due: 0 }, { now: NOW, reviewing: true, assisted: false }), { level: 2, due: NOW + 7 * DAY });
  assert.deepEqual(scheduleReview({ level: 3, due: 0 }, { now: NOW, reviewing: true, assisted: true }), { level: 0, due: NOW + DAY });
  const top = REVIEW_INTERVALS.length - 1;
  assert.equal(scheduleReview({ level: top, due: 0 }, { now: NOW, reviewing: true, assisted: false }).level, top);

  const passed = recordCheck(emptyEntry(), { passed: true, difficulty: 1, now: NOW });
  const reviewed = recordCheck(passed, { passed: true, difficulty: 1, now: NOW + 2 * DAY, reviewing: true });
  assert.equal(reviewed.review.level, 1);
  assert.equal(reviewed.review.due, NOW + 2 * DAY + 3 * DAY);
});

const ORDER = [{ id: 'a/1' }, { id: 'a/2' }, { id: 'b/1' }];

test('dueReviews returns due challenges, oldest first; nextChallenge skips passed ones', () => {
  const entries = {
    'a/1': { status: 'passed', review: { level: 0, due: NOW - 2 * DAY }, xp: 10 },
    'a/2': { status: 'passed', review: { level: 0, due: NOW + DAY }, xp: 20 },
    'b/1': { status: 'passed', review: { level: 0, due: NOW - 5 * DAY }, xp: 0 },
  };
  assert.deepEqual(dueReviews(ORDER, entries, NOW).map((c) => c.id), ['b/1', 'a/1']);
  assert.equal(nextChallenge(ORDER, entries), null);
  assert.equal(nextChallenge(ORDER, { 'a/1': entries['a/1'] }).id, 'a/2');
  assert.deepEqual(summarize(ORDER, { ...entries, 'b/1': { status: 'attempted', xp: 0 } }), { total: 3, passed: 2, attempted: 1, xp: 30 });
});

test('streakDays counts consecutive days with a pass, ending today or yesterday', () => {
  const at = (d) => ({ firstPassAt: NOW - d * DAY, lastPassAt: null });
  assert.equal(streakDays({ x: at(0), y: at(1), z: at(2) }, NOW), 3);
  assert.equal(streakDays({ x: at(1), y: at(2) }, NOW), 2);
  assert.equal(streakDays({ x: at(0), y: at(2) }, NOW), 1);
  assert.equal(streakDays({}, NOW), 0);
});

test('formatDue', () => {
  assert.equal(formatDue(NOW - 3 * DAY, NOW), '3d overdue');
  assert.equal(formatDue(NOW - 1000, NOW), 'due');
  assert.equal(formatDue(NOW + 3 * DAY, NOW), 'in 3d');
});
