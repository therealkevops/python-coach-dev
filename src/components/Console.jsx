import { useMemo } from 'react';
import { explainError } from '../lib/errorHelp.js';
import { highlightPython } from '../lib/highlight.js';
import { renderInline } from '../lib/markdown.js';
import { hrefFor } from '../lib/router.js';
import { formatDue } from '../state/progress.js';

const TABS = [
  ['results', 'Results'],
  ['output', 'Output'],
  ['hints', 'Hints'],
  ['solution', 'Solution'],
];

export default function Console(props) {
  const { tab, setTab, result, challenge, hintsShown, runCount } = props;
  const printed = result?.stdout;
  return (
    // data-runs counts finished runs, so tests can wait for a new result rather than read the previous one.
    <div className="console" data-runs={runCount}>
      <div className="tabs" role="tablist">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? 'active' : ''}
            onClick={() => setTab(key)}
          >
            {label}
            {key === 'output' && printed ? <span className="count">{printed.split('\n').filter(Boolean).length}</span> : null}
            {key === 'hints' ? <span className="count">{hintsShown}/{challenge.hints.length}</span> : null}
          </button>
        ))}
        <span className="spacer" />
        <RuntimeStatus python={props.python} busy={props.busy} />
      </div>
      <div className="console-body">
        {tab === 'results' && <Results {...props} />}
        {tab === 'output' && <Output result={result} />}
        {tab === 'hints' && <Hints {...props} />}
        {tab === 'solution' && <Solution {...props} />}
      </div>
    </div>
  );
}

function RuntimeStatus({ python, busy }) {
  const label = busy && python.status === 'ready' ? 'Starting' : python.detail;
  return <span className={`runtime runtime-${python.status}`} title="Python runs in your browser (Pyodide)">{label}</span>;
}

function Results({ result, outcome, busy, python, goToLine, review, next, alreadyPassed }) {
  if (!result) {
    return (
      <div className="empty">
        {busy ? `${python.detail}…` : (
          <>
            <p><kbd>Ctrl</kbd>+<kbd>Enter</kbd> checks your code against the tests. <kbd>Ctrl</kbd>+<kbd>'</kbd> runs it and shows what it prints.</p>
            {alreadyPassed && !review && <p className="muted">You've passed this one. Check again any time.</p>}
            {python.status === 'loading' && <p className="muted">{python.detail}. The first load takes a few seconds and is cached after that.</p>}
            {python.status === 'error' && <p className="fail">Python failed to load: {python.detail}. Check your connection and reload the page.</p>}
          </>
        )}
      </div>
    );
  }
  if (result.timeout) {
    return (
      <div className="error-box">
        <div className="error-title">Stopped after {result.seconds}s</div>
        <p>Your code ran too long, which usually means a loop never ends. Check that each <code>while</code> loop&apos;s condition eventually becomes false. Python was restarted.</p>
      </div>
    );
  }
  if (result.internalError) {
    return (
      <div className="error-box">
        <div className="error-title">The coach couldn&apos;t run this</div>
        <pre className="mono">{result.internalError}</pre>
      </div>
    );
  }
  if (result.error) return <ErrorBox error={result.error} goToLine={goToLine} where="while running your code" />;
  if (result.mode === 'run') {
    return <div className="empty"><p>Ran without errors in {result.ms} ms. {result.stdout ? 'See Output.' : 'Nothing was printed.'}</p></div>;
  }

  const passed = result.tests.filter((t) => t.status === 'pass').length;
  const all = passed === result.tests.length;
  return (
    <div>
      <div className={`summary ${all ? 'pass' : 'fail'}`}>
        <strong>{passed}/{result.tests.length} passed</strong>
        <span className="muted mono">{result.ms} ms</span>
      </div>
      {all && outcome && <PassNote outcome={outcome} review={review} next={next} />}
      <ol className="tests">
        {result.tests.map((t) => <TestRow key={t.name} test={t} goToLine={goToLine} />)}
      </ol>
    </div>
  );
}

function PassNote({ outcome, review, next }) {
  const now = Date.now();
  return (
    <div className="pass-note">
      {outcome.firstPass && (outcome.assisted
        ? <span>Solved with the solution revealed: no XP. A review is scheduled to lock it in.</span>
        : <span>Solved. <strong>+{outcome.xp} xp</strong>.</span>)}
      {!outcome.firstPass && review && <span>Review passed. Next review {formatDue(outcome.review.due, now)} (level {outcome.review.level}).</span>}
      {!outcome.firstPass && !review && <span>Passed again.</span>}
      {next && <a href={hrefFor.challenge(next.id)}>Next: {next.code} {next.title} →</a>}
    </div>
  );
}

function TestRow({ test, goToLine }) {
  const userLine = test.error?.trace?.filter((f) => f.file === 'main.py').at(-1);
  return (
    <li className={`test test-${test.status}`}>
      <span className="tag">{test.status === 'pass' ? 'PASS' : test.status === 'fail' ? 'FAIL' : 'ERROR'}</span>
      <span className="label">{test.label}</span>
      <span className="ms mono">{test.ms} ms</span>
      {test.status !== 'pass' && <div className="message mono">{test.message}</div>}
      {userLine && (
        <div className="where">
          <button type="button" className="link" onClick={() => goToLine(userLine.line)}>line {userLine.line}</button>
          <code className="mono">{userLine.source}</code>
          {explainError(test.error.type) && <div className="explain">{explainError(test.error.type)}</div>}
        </div>
      )}
      {test.stdout && (
        <details className="test-out">
          <summary>printed during this test</summary>
          <pre className="mono">{test.stdout}</pre>
        </details>
      )}
    </li>
  );
}

function ErrorBox({ error, goToLine, where }) {
  const help = explainError(error.type);
  return (
    <div className="error-box">
      <div className="error-title">
        {error.type}{error.line ? <> on <button type="button" className="link" onClick={() => goToLine(error.line)}>line {error.line}</button></> : null}
        <span className="muted"> {where}</span>
      </div>
      <div className="mono message">{error.message}</div>
      {error.source && <pre className="mono source">{error.source}</pre>}
      {help && <p className="explain">{help}</p>}
      {error.trace?.length > 1 && (
        <details>
          <summary>Traceback</summary>
          <pre className="mono">{error.trace.map((f) => `${f.file}:${f.line} in ${f.name}\n    ${f.source || ''}`).join('\n')}</pre>
        </details>
      )}
    </div>
  );
}

function Output({ result }) {
  if (!result) return <div className="empty"><p>Output from <code>print()</code> appears here after Run or Check.</p></div>;
  if (!result.stdout) return <div className="empty"><p>Nothing was printed.</p></div>;
  return <pre className="stdout mono">{result.stdout}</pre>;
}

function Hints({ challenge, hintsShown, onShowHint, alreadyPassed, review }) {
  const remaining = challenge.hints.length - hintsShown;
  return (
    <div>
      <ol className="hints">
        {challenge.hints.slice(0, hintsShown).map((h, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: renderInline(h) }} />
        ))}
      </ol>
      {remaining > 0 ? (
        <div className="hint-action">
          <button type="button" onClick={onShowHint}>Show hint {hintsShown + 1} of {challenge.hints.length}</button>
          {!alreadyPassed && !review && <span className="muted">Each hint reduces the XP for this challenge by a quarter.</span>}
          {review && <span className="muted">Using a hint resets this challenge&apos;s review interval.</span>}
        </div>
      ) : <p className="muted">No more hints. The Solution tab has the reference answer.</p>}
    </div>
  );
}

function Solution({ challenge, solutionShown, onRevealSolution, alreadyPassed, review }) {
  const html = useMemo(() => highlightPython(challenge.solution), [challenge]);
  if (!solutionShown) {
    return (
      <div className="empty">
        <p>
          {alreadyPassed && !review
            ? 'You have solved this. Compare your approach with the reference solution.'
            : review
              ? 'Revealing the solution resets this challenge’s review interval.'
              : 'Revealing the solution before you pass means this challenge earns no XP. Try the hints first.'}
        </p>
        <button type="button" onClick={onRevealSolution}>Reveal solution</button>
      </div>
    );
  }
  return (
    <div>
      <pre className="md-code solution"><code dangerouslySetInnerHTML={{ __html: html }} /></pre>
      <p className="muted">Retype it rather than pasting. You remember more that way.</p>
    </div>
  );
}
