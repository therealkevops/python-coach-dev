// Small shared presentational pieces.

export function Difficulty({ value }) {
  return (
    <span className="difficulty" title={['', 'Beginner', 'Intermediate', 'Advanced'][value]} aria-label={`difficulty ${value} of 3`}>
      {[1, 2, 3].map((n) => <i key={n} className={n <= value ? 'on' : ''} />)}
    </span>
  );
}

export function StatusMark({ entry, due }) {
  const status = entry?.status || 'new';
  const title = due ? 'review due' : status;
  return <span className={`mark mark-${status}${due ? ' mark-due' : ''}`} title={title} aria-label={title} />;
}

export function Bar({ value, total }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <span className="bar" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={total}>
      <span style={{ width: `${pct}%` }} />
    </span>
  );
}
