// The left-hand outline on the challenge page: every track, with the current one open.
import { useState } from 'react';
import { catalog } from '../content/index.js';
import { useStore } from '../state/store.js';
import { hrefFor } from '../lib/router.js';
import { StatusMark } from './bits.jsx';
import { summarize } from '../state/progress.js';

export default function ChallengeList({ currentId }) {
  const entries = useStore((s) => s.entries);
  const currentTrack = currentId.split('/')[0];
  const [open, setOpen] = useState(() => new Set([currentTrack]));
  const now = Date.now();

  const toggle = (id) => setOpen((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <nav className="outline" aria-label="Challenges">
      {catalog.tracks.map((track) => {
        const s = summarize(track.challenges, entries);
        const isOpen = open.has(track.id);
        return (
          <div key={track.id} className="outline-track">
            <button type="button" className="outline-head" onClick={() => toggle(track.id)} aria-expanded={isOpen}>
              <span className="caret">{isOpen ? '▾' : '▸'}</span>
              <span className="mono num">{track.index}</span>
              <span className="name">{track.title}</span>
              <span className="mono count">{s.passed}/{s.total}</span>
            </button>
            {isOpen && (
              <ol>
                {track.challenges.map((c) => {
                  const e = entries[c.id];
                  const due = e?.review && e.review.due <= now;
                  return (
                    <li key={c.id} className={c.id === currentId ? 'current' : ''}>
                      <a href={hrefFor.challenge(c.id)} aria-current={c.id === currentId ? 'page' : undefined}>
                        <StatusMark entry={e} due={due} />
                        <span className="mono code">{c.code}</span>
                        <span className="title">{c.title}</span>
                      </a>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        );
      })}
    </nav>
  );
}
