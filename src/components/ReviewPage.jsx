import { catalog } from '../content/index.js';
import { useStore } from '../state/store.js';
import { hrefFor } from '../lib/router.js';
import { dueReviews, formatDue, REVIEW_INTERVALS, upcomingReviews } from '../state/progress.js';

export default function ReviewPage() {
  const entries = useStore((s) => s.entries);
  const now = Date.now();
  const due = dueReviews(catalog.order, entries, now);
  const upcoming = upcomingReviews(catalog.order, entries, now);

  return (
    <div className="page narrow">
      <h1>Review</h1>
      <p className="muted">
        Solving a challenge again from scratch, spaced out over time, is what makes it stick. A clean pass, with no hints
        and no solution, moves the challenge up a level. The intervals are {REVIEW_INTERVALS.join(', ')} days. A pass with
        help sends it back to level 0.
      </p>
      {due.length > 0 && (
        <p><a className="button primary" href={hrefFor.challenge(due[0].id, { review: true })}>Start: {due[0].code} {due[0].title}</a></p>
      )}
      <ReviewTable title={`Due (${due.length})`} items={due} entries={entries} now={now} link empty="Nothing due. Come back later, or carry on along the path." />
      <ReviewTable title={`Upcoming (${upcoming.length})`} items={upcoming} entries={entries} now={now} empty="Pass a challenge to schedule its first review." />
    </div>
  );
}

function ReviewTable({ title, items, entries, now, link, empty }) {
  return (
    <section className="track">
      <h2>{title}</h2>
      {items.length === 0 ? <p className="muted">{empty}</p> : (
        <table className="grid">
          <thead>
            <tr><th className="c-code">#</th><th>challenge</th><th className="c-num">level</th><th className="c-review">due</th></tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id}>
                <td className="c-code mono">{c.code}</td>
                <td>{link ? <a href={hrefFor.challenge(c.id, { review: true })}>{c.title}</a> : <a href={hrefFor.challenge(c.id)}>{c.title}</a>}</td>
                <td className="c-num mono">L{entries[c.id].review.level}</td>
                <td className="c-review mono">{formatDue(entries[c.id].review.due, now)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
