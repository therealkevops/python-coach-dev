import { useMemo } from 'react';
import mockllmDoc from '../../docs/mockllm.md?raw';
import { conceptIndex } from '../content/index.js';
import { renderMarkdown } from '../lib/markdown.js';
import { hrefFor } from '../lib/router.js';
import { PYODIDE_VERSION } from '../runtime/config.js';

const SHORTCUTS = [
  ['Ctrl/Cmd + Enter', 'Check: run the tests'],
  ["Ctrl/Cmd + '", 'Run: run your code and show what it prints'],
  ['Tab / Shift + Tab', 'Indent / dedent the selected lines'],
  ['Ctrl/Cmd + /', 'Comment or uncomment lines'],
  ['Ctrl/Cmd + Z / Shift + Z', 'Undo / redo'],
  ['Ctrl/Cmd + F', 'Find in the editor'],
  ['Ctrl + Space', 'Autocomplete'],
  ['Alt + ↑ / ↓', 'Move the line up / down'],
];

export default function ReferencePage() {
  const doc = useMemo(() => renderMarkdown(mockllmDoc), []);
  return (
    <div className="page ref-layout">
      <div className="ref-main">
        <h1>Reference</h1>

        <section className="track">
          <h2>Environment</h2>
          <table className="grid kv">
            <tbody>
              <tr><th>Python</th><td>3.13, running in your browser through Pyodide {PYODIDE_VERSION}. Your code never leaves the page.</td></tr>
              <tr><th>Libraries</th><td>The standard library, <code>mockllm</code>, <code>pydantic</code> and <code>numpy</code>. They load on first import.</td></tr>
              <tr><th>Not available</th><td>Network access, <code>input()</code>, files that persist between runs, and <code>asyncio.run()</code>. The tests await async functions for you.</td></tr>
              <tr><th>Limits</th><td>A run is stopped after 12 seconds, and output is cut off at 20,000 characters.</td></tr>
              <tr><th>Tests</th><td>Tests run after your code, in the same namespace, so they call your functions directly. <code>OUTPUT</code> holds what your code printed.</td></tr>
            </tbody>
          </table>
        </section>

        <section className="track">
          <h2>Keyboard</h2>
          <table className="grid kv">
            <tbody>
              {SHORTCUTS.map(([k, v]) => <tr key={k}><th className="mono">{k}</th><td>{v}</td></tr>)}
            </tbody>
          </table>
        </section>

        <section className="track lesson" dangerouslySetInnerHTML={{ __html: doc }} />
      </div>

      <aside className="ref-side">
        <h2>Concept index</h2>
        <dl className="concept-index">
          {conceptIndex.map(([concept, challenges]) => (
            <div key={concept}>
              <dt>{concept}</dt>
              <dd>
                {challenges.map((c, i) => (
                  <span key={c.id}>{i > 0 && ', '}<a href={hrefFor.challenge(c.id)} title={c.title}>{c.code}</a></span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </aside>
    </div>
  );
}
