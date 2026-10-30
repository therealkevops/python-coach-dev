import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Editor from './Editor.jsx';
import Console from './Console.jsx';
import ChallengeList from './ChallengeList.jsx';
import { catalog } from '../content/index.js';
import { actions, useStore } from '../state/store.js';
import { runPython, usePythonStatus, warmUp } from '../runtime/python.js';
import { renderMarkdown } from '../lib/markdown.js';
import { hrefFor } from '../lib/router.js';
import { formatDue } from '../state/progress.js';
import { Difficulty } from './bits.jsx';

const countTests = (tests) => (tests.match(/^(async )?def test_/gm) || []).length;

export function resultPassed(result) {
  return Boolean(result && !result.error && !result.timeout && !result.internalError
    && result.tests?.length && result.tests.every((t) => t.status === 'pass'));
}

export default function ChallengePage({ id, review }) {
  const challenge = catalog.byId.get(id);
  if (!challenge) {
    return (
      <div className="page narrow">
        <h1>Challenge not found</h1>
        <p>No challenge has the id <code>{id}</code>. <a href={hrefFor.path()}>Back to the path</a>.</p>
      </div>
    );
  }
  // Remount everything when the challenge or mode changes, so no state leaks between them.
  return <Challenge key={`${id}:${review}`} challenge={challenge} review={review} />;
}

function Challenge({ challenge, review }) {
  const { id } = challenge;
  const entry = useStore((s) => s.entries[id]);
  const python = usePythonStatus();
  const [code, setCode] = useState(() => (review ? challenge.starter : entry?.code ?? challenge.starter));
  const [editorKey, setEditorKey] = useState(0);
  const [result, setResult] = useState(null);
  const [outcome, setOutcome] = useState(null);
  const [busy, setBusy] = useState(null);
  const [tab, setTab] = useState('results');
  // Hints and solution views in this session. In review mode they don't touch the stored first-solve record.
  const [sessionHints, setSessionHints] = useState(review ? 0 : entry?.hintsShown ?? 0);
  const [sessionSolution, setSessionSolution] = useState(review ? false : entry?.solutionViewed ?? false);
  const editorRef = useRef(null);
  const saveTimer = useRef(null);
  const codeRef = useRef(code);
  codeRef.current = code;

  const index = catalog.order.indexOf(challenge);
  const prev = catalog.order[index - 1];
  const next = catalog.order[index + 1];
  const track = catalog.tracks.find((t) => t.id === challenge.track);
  const lessonHtml = useMemo(() => renderMarkdown(challenge.lesson), [challenge]);

  useEffect(() => {
    warmUp();
    actions.visit(id);
  }, [id]);

  // Flush a pending save when leaving the page.
  useEffect(() => () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      if (!review) actions.saveCode(id, codeRef.current);
    }
  }, [id, review]);

  const onChange = useCallback((value) => {
    setCode(value);
    if (review) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { saveTimer.current = null; actions.saveCode(id, value); }, 400);
  }, [id, review]);

  const execute = useCallback(async (mode) => {
    if (busy) return;
    setBusy(mode);
    setOutcome(null);
    const res = await runPython({
      code: codeRef.current, tests: challenge.tests, mode, packages: challenge.packages,
    });
    setResult(res);
    setBusy(null);
    if (mode === 'run') {
      setTab(res.error || res.timeout || res.internalError ? 'results' : 'output');
      return;
    }
    setTab('results');
    const passed = resultPassed(res);
    const { before, after } = actions.check(id, {
      passed, difficulty: challenge.difficulty, reviewing: review,
      hintsUsed: sessionHints, solutionViewed: sessionSolution,
    });
    if (passed) setOutcome({ firstPass: before.status !== 'passed', xp: after.xp, review: after.review, assisted: after.solutionViewed });
  }, [busy, challenge, id, review, sessionHints, sessionSolution]);

  const check = useCallback(() => execute('test'), [execute]);
  const run = useCallback(() => execute('run'), [execute]);

  // Shortcuts that also work when the editor doesn't have focus.
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.target.closest?.('.cm-editor')) return;
      if (e.key === 'Enter') { e.preventDefault(); check(); }
      if (e.key === "'") { e.preventDefault(); run(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [check, run]);

  const reset = () => {
    if (!window.confirm('Replace your code with the starter code?')) return;
    setCode(challenge.starter);
    if (!review) actions.saveCode(id, challenge.starter);
    setEditorKey((k) => k + 1);
    setResult(null);
  };

  const showHint = () => {
    const n = Math.min(sessionHints + 1, challenge.hints.length);
    setSessionHints(n);
    if (!review) actions.showHint(id, n);
  };

  const revealSolution = () => {
    setSessionSolution(true);
    if (!review) actions.viewSolution(id);
  };

  const status = entry?.status || 'new';

  return (
    <div className="challenge-layout">
      <ChallengeList currentId={id} />

      <section className="lesson-pane" aria-label="Lesson">
        <div className="lesson-head">
          <div className="crumbs">
            <span className="mono">{challenge.code}</span>
            <span className="sep">/</span>
            <span>{track.title}</span>
          </div>
          <h1>{challenge.title}</h1>
          <dl className="meta-row">
            <div><dt>level</dt><dd><Difficulty value={challenge.difficulty} /></dd></div>
            <div><dt>tests</dt><dd className="mono">{countTests(challenge.tests)}</dd></div>
            <div><dt>status</dt><dd className={`status-${status}`}>{status}</dd></div>
            {entry?.review && <div><dt>review</dt><dd>L{entry.review.level} · {formatDue(entry.review.due, Date.now())}</dd></div>}
          </dl>
          <div className="concepts">{challenge.concepts.join(' · ')}</div>
        </div>
        {review && (
          <div className="notice">
            Review: solve it again from the starter code. Your saved solution is untouched. A clean pass (no hints, no solution) moves the next review further out.
          </div>
        )}
        <article className="lesson" dangerouslySetInnerHTML={{ __html: lessonHtml }} />
        <nav className="lesson-foot">
          {prev ? <a href={hrefFor.challenge(prev.id)}>← {prev.code} {prev.title}</a> : <span />}
          {next ? <a href={hrefFor.challenge(next.id)}>{next.code} {next.title} →</a> : <span />}
        </nav>
      </section>

      <section className="work-pane" aria-label="Code">
        <div className="toolbar">
          <span className="mono file">main.py{review ? ' (review)' : ''}</span>
          <span className="spacer" />
          <button type="button" onClick={reset} title="Replace your code with the starter code">Reset</button>
          <button type="button" onClick={run} disabled={!!busy} title="Run your code and show what it prints (Ctrl+')">
            {busy === 'run' ? 'Running…' : 'Run'}
          </button>
          <button type="button" className="primary" onClick={check} disabled={!!busy} title="Run the tests (Ctrl+Enter)">
            {busy === 'test' ? 'Checking…' : 'Check'}
          </button>
        </div>
        <Editor key={editorKey} value={code} onChange={onChange} onCheck={check} onRun={run} editorRef={editorRef} />
        <Console
          challenge={challenge}
          result={result}
          outcome={outcome}
          busy={busy}
          python={python}
          tab={tab}
          setTab={setTab}
          hintsShown={sessionHints}
          onShowHint={showHint}
          solutionShown={sessionSolution}
          onRevealSolution={revealSolution}
          alreadyPassed={status === 'passed'}
          review={review}
          next={next}
          goToLine={(line) => editorRef.current?.goToLine(line)}
        />
      </section>
    </div>
  );
}
