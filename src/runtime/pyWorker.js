// Web Worker that hosts Pyodide, so Python never blocks the page and a runaway loop
// can be stopped by terminating the worker.
import runnerSource from '../py/coach_runner.py?raw';
import mockllmSource from '../py/mockllm.py?raw';
import { PYODIDE_INDEX_URL } from './config.js';

let pyodide = null;
let ready = null;

function post(message) {
  self.postMessage(message);
}

async function init() {
  post({ type: 'status', status: 'loading', detail: 'Downloading Python' });
  const { loadPyodide } = await import(/* @vite-ignore */ `${PYODIDE_INDEX_URL}pyodide.mjs`);
  pyodide = await loadPyodide({ indexURL: PYODIDE_INDEX_URL, stdout: () => {}, stderr: () => {} });
  pyodide.FS.writeFile('/home/pyodide/coach_runner.py', runnerSource);
  pyodide.FS.writeFile('/home/pyodide/mockllm.py', mockllmSource);
  const version = await pyodide.runPythonAsync('import sys, coach_runner, mockllm\n".".join(map(str, sys.version_info[:3]))');
  post({ type: 'status', status: 'ready', detail: `Python ${version}` });
}

async function run({ id, code, tests, mode, packages }) {
  await ready;
  const needed = new Set(packages || []);
  const loaded = pyodide.loadedPackages;
  const missing = [...needed].filter((p) => !(p in loaded));
  if (missing.length) {
    post({ type: 'status', status: 'loading', detail: `Loading ${missing.join(', ')}` });
    await pyodide.loadPackage(missing);
  }
  // Also load any bundled package the code imports (numpy, for example).
  await pyodide.loadPackagesFromImports(`${code}\n${tests || ''}`);
  post({ type: 'status', status: 'running', detail: mode === 'test' ? 'Checking' : 'Running' });
  post({ type: 'started', id });
  pyodide.globals.set('_coach_code', code);
  pyodide.globals.set('_coach_tests', tests || '');
  pyodide.globals.set('_coach_mode', mode);
  const json = await pyodide.runPythonAsync('await coach_runner.run(_coach_code, _coach_tests, _coach_mode)');
  post({ type: 'result', id, result: JSON.parse(json) });
  post({ type: 'status', status: 'ready' });
}

self.onmessage = (event) => {
  const message = event.data;
  if (message.type === 'init') {
    ready ??= init().catch((err) => {
      post({ type: 'status', status: 'error', detail: String(err?.message || err) });
      throw err;
    });
  } else if (message.type === 'run') {
    ready ??= init();
    run(message).catch((err) => {
      post({ type: 'failed', id: message.id, error: String(err?.message || err) });
      post({ type: 'status', status: 'ready' });
    });
  }
};
