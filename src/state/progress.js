// Pure functions over progress state: scoring, review scheduling and summaries.
// Kept free of React and storage so they can be unit-tested in Node.

export const DAY = 24 * 60 * 60 * 1000;
// Days until the next review, by review level. A clean review moves up a level;
// a review that needed the solution drops back to the first one.
export const REVIEW_INTERVALS = [1, 3, 7, 14, 30, 60];

export function emptyEntry() {
  return {
    status: 'new',          // new | attempted | passed
    checks: 0,              // times Check was run
    hintsShown: 0,          // most hints revealed (on the first solve)
    solutionViewed: false,  // solution revealed before the first pass
    xp: 0,
    firstPassAt: null,
    lastPassAt: null,
    review: null,           // { level, due } once passed
    code: null,             // the learner's saved code
  };
}

// XP for a first solve: 10 per difficulty level, minus a quarter per hint (down to a quarter),
// and nothing if the solution was revealed first.
export function computeXp(difficulty, hintsShown, solutionViewed) {
  if (solutionViewed) return 0;
  const base = 10 * difficulty;
  return Math.round(base * Math.max(0.25, 1 - 0.25 * hintsShown));
}

export function scheduleReview(previous, { now, reviewing, assisted }) {
  let level = 0;
  if (previous && reviewing) level = assisted ? 0 : Math.min(previous.level + 1, REVIEW_INTERVALS.length - 1);
  else if (previous) level = previous.level;
  return { level, due: now + REVIEW_INTERVALS[level] * DAY };
}

// Apply the outcome of one Check to a challenge's entry. Returns a new entry.
export function recordCheck(entry, { passed, difficulty, now, reviewing = false, hintsUsed = 0, solutionViewed = false }) {
  const next = { ...(entry || emptyEntry()) };
  next.checks += 1;
  if (!passed) {
    if (next.status === 'new') next.status = 'attempted';
    return next;
  }
  const firstPass = next.status !== 'passed';
  if (firstPass) {
    next.status = 'passed';
    next.firstPassAt = now;
    next.xp = computeXp(difficulty, next.hintsShown, next.solutionViewed);
    next.review = scheduleReview(null, { now });
  } else if (reviewing) {
    next.review = scheduleReview(next.review, { now, reviewing: true, assisted: hintsUsed > 0 || solutionViewed });
  }
  next.lastPassAt = now;
  return next;
}

export function dueReviews(order, entries, now) {
  return order
    .filter((c) => entries[c.id]?.review && entries[c.id].review.due <= now)
    .sort((a, b) => entries[a.id].review.due - entries[b.id].review.due);
}

export function upcomingReviews(order, entries, now) {
  return order
    .filter((c) => entries[c.id]?.review && entries[c.id].review.due > now)
    .sort((a, b) => entries[a.id].review.due - entries[b.id].review.due);
}

export function nextChallenge(order, entries) {
  return order.find((c) => entries[c.id]?.status !== 'passed') || null;
}

export function summarize(challenges, entries) {
  let passed = 0, attempted = 0, xp = 0;
  for (const c of challenges) {
    const e = entries[c.id];
    if (!e) continue;
    if (e.status === 'passed') passed += 1;
    else if (e.status === 'attempted') attempted += 1;
    xp += e.xp || 0;
  }
  return { total: challenges.length, passed, attempted, xp };
}

// Consecutive days, ending today or yesterday, with at least one pass.
export function streakDays(entries, now) {
  const days = new Set();
  for (const e of Object.values(entries)) {
    for (const t of [e.firstPassAt, e.lastPassAt]) if (t) days.add(Math.floor(localDay(t)));
  }
  let day = Math.floor(localDay(now));
  if (!days.has(day)) day -= 1;
  let streak = 0;
  while (days.has(day)) { streak += 1; day -= 1; }
  return streak;
}

function localDay(t) {
  return (t - new Date(t).getTimezoneOffset() * 60 * 1000) / DAY;
}

export function formatDue(due, now) {
  const days = Math.round((due - now) / DAY);
  if (due <= now) return days <= -1 ? `${-days}d overdue` : 'due';
  if (days <= 0) return 'today';
  return `in ${days}d`;
}
