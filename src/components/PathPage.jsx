import { catalog } from '../content/index.js';
import { useStore } from '../state/store.js';
import { hrefFor } from '../lib/router.js';
import { dueReviews, formatDue, nextChallenge, streakDays, summarize } from '../state/progress.js';
import { Bar, Difficulty, StatusMark } from './bits.jsx';

export default function PathPage() {
  const entries = useStore((s) => s.entries);
  const lastId = useStore((s) => s.lastChallenge);
  const now = Date.now();
  const total = summarize(catalog.order, entries);
  const next = nextChallenge(catalog.order, entries);
  const due = dueReviews(catalog.order, entries, now);
  const last = lastId && catalog.byId.get(lastId);
  const fresh = total.passed === 0 && total.attempted === 0;

  return (
    <div className="page">
      <div className="stats-strip">
        <Stat label="passed" value={`${total.passed}/${total.total}`} extra={<Bar value={total.passed} total={total.total} />} />
        <Stat label="xp" value={total.xp} />
        <Stat label="reviews due" value={due.length} href={due.length ? hrefFor.review() : null} />
        <Stat label="streak" value={`${streakDays(entries, now)}d`} />
        <div className="stat stat-next">
          <span className="stat-label">next</span>
          {next ? (
            <a className="stat-value" href={hrefFor.challenge(next.id)}>
              <span className="mono">{next.code}</span> {next.title} →
            </a>
          ) : <span className="stat-value">Path complete. Keep your reviews going.</span>}
          {last && last.id !== next?.id && <a className="muted small" href={hrefFor.challenge(last.id)}>or resume {last.code}</a>}
        </div>
      </div>

      {fresh && (
        <div className="intro">
          <p>
            <strong>Python for AI and agents, from zero.</strong> Each challenge is a short lesson and a piece of code to write.
            Tests check your code, and everything runs in your browser. Work through the tracks in order: each one builds on
            the last, from <code>print()</code> to an agent with tools, guardrails and evals.
          </p>
          <p className="muted">
            Passing a challenge schedules a review in 1, 3, 7, 14, 30 and then 60 days, where you solve it again from scratch.
            Hints cost XP. Revealing the solution earns none. Progress is saved in this browser. The Settings page can export it.
          </p>
        </div>
      )}

      {catalog.tracks.map((track) => {
        const s = summarize(track.challenges, entries);
        return (
          <section key={track.id} className="track">
            <header className="track-head">
              <h2><span className="mono num">{track.index}</span> {track.title}</h2>
              <span className="mono muted">{s.passed}/{s.total}</span>
              <Bar value={s.passed} total={s.total} />
              <span className="mono muted">{s.xp} xp</span>
            </header>
            <p className="track-summary">{track.summary}</p>
            <table className="grid">
              <thead>
                <tr>
                  <th className="c-mark" aria-label="status" />
                  <th className="c-code">#</th>
                  <th>challenge</th>
                  <th className="c-concepts">concepts</th>
                  <th className="c-num">level</th>
                  <th className="c-num">checks</th>
                  <th className="c-num">hints</th>
                  <th className="c-num">xp</th>
                  <th className="c-review">review</th>
                </tr>
              </thead>
              <tbody>
                {track.challenges.map((c) => {
                  const e = entries[c.id];
                  const isDue = e?.review && e.review.due <= now;
                  return (
                    <tr key={c.id} className={next?.id === c.id ? 'is-next' : ''}>
                      <td className="c-mark"><StatusMark entry={e} due={isDue} /></td>
                      <td className="c-code mono">{c.code}</td>
                      <td><a href={hrefFor.challenge(c.id)}>{c.title}</a></td>
                      <td className="c-concepts muted">{c.concepts.join(', ')}</td>
                      <td className="c-num"><Difficulty value={c.difficulty} /></td>
                      <td className="c-num mono">{e?.checks || ''}</td>
                      <td className="c-num mono">{e?.hintsShown || ''}{e?.solutionViewed ? '+S' : ''}</td>
                      <td className="c-num mono">{e?.status === 'passed' ? e.xp : ''}</td>
                      <td className={`c-review mono ${isDue ? 'due' : 'muted'}`}>
                        {e?.review ? (isDue
                          ? <a href={hrefFor.challenge(c.id, { review: true })}>{formatDue(e.review.due, now)}</a>
                          : formatDue(e.review.due, now)) : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}

function Stat({ label, value, extra, href }) {
  const body = <span className="stat-value mono">{value}</span>;
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      {href ? <a href={href}>{body}</a> : body}
      {extra}
    </div>
  );
}
