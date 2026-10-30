import { useRef, useState } from 'react';
import { actions, useStore } from '../state/store.js';

export default function SettingsPage() {
  const settings = useStore((s) => s.settings);
  const entries = useStore((s) => s.entries);
  const fileInput = useRef(null);
  const [message, setMessage] = useState(null);

  const exportProgress = () => {
    const blob = new Blob([actions.exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pycoach-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importProgress = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      if (!window.confirm('Replace your current progress with this file?')) return;
      actions.importJson(text);
      setMessage({ ok: true, text: `Imported ${file.name}.` });
    } catch (err) {
      setMessage({ ok: false, text: `Couldn't import: ${err.message}` });
    }
  };

  const reset = () => {
    if (window.confirm('Delete all progress and saved code in this browser? This cannot be undone.')) {
      actions.reset();
      setMessage({ ok: true, text: 'Progress reset.' });
    }
  };

  return (
    <div className="page narrow">
      <h1>Settings</h1>
      <section className="track">
        <h2>Display</h2>
        <table className="grid kv">
          <tbody>
            <tr>
              <th>Theme</th>
              <td>
                <select value={settings.theme} onChange={(e) => actions.setting('theme', e.target.value)}>
                  <option value="system">Match system</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </td>
            </tr>
            <tr>
              <th>Editor font size</th>
              <td>
                <select value={settings.fontSize} onChange={(e) => actions.setting('fontSize', Number(e.target.value))}>
                  {[12, 13, 14, 15, 16, 18].map((n) => <option key={n} value={n}>{n}px</option>)}
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="track">
        <h2>Progress data</h2>
        <p className="muted">
          Progress and your code are saved in this browser only ({Object.keys(entries).length} challenges recorded).
          Export a file to back them up or move them to another browser.
        </p>
        <div className="button-row">
          <button type="button" onClick={exportProgress}>Export progress</button>
          <button type="button" onClick={() => fileInput.current.click()}>Import progress…</button>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={importProgress} />
          <button type="button" className="danger" onClick={reset}>Reset everything</button>
        </div>
        {message && <p className={message.ok ? 'pass' : 'fail'}>{message.text}</p>}
      </section>
    </div>
  );
}
