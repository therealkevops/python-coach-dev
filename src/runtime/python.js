// The page's handle on the Python worker: status for the UI, and run() for code.
import { useSyncExternalStore } from 'react';
import { RUN_TIMEOUT_MS } from './config.js';

let worker = null;
let status = { status: 'idle', detail: 'Python not loaded' };
const listeners = new Set();
const pending = new Map();
let nextId = 1;
let queue = Promise.resolve();

function setStatus(next) {
  status = { ...status, ...next };
  listeners.forEach((l) => l());
}

function startWorker() {
  worker = new Worker(new URL('./pyWorker.js', import.meta.url), { type: 'module' });
  worker.onmessage = ({ data }) => {
    if (data.type === 'status') {
      const next = { status: data.status, detail: data.detail ?? (data.status === 'ready' ? status.version : status.detail) };
      if (data.status === 'ready' && data.detail) next.version = data.detail;
      setStatus(next);
    } else if (data.type === 'started') {
      pending.get(data.id)?.started();
    } else if (data.type === 'result' || data.type === 'failed') {
      pending.get(data.id)?.settle(data);
    }
  };
  worker.onerror = (event) => {
    setStatus({ status: 'error', detail: event.message || 'The Python worker failed to start' });
  };
  worker.postMessage({ type: 'init' });
}

export function warmUp() {
  if (!worker) startWorker();
}

function restart() {
  worker?.terminate();
  worker = null;
  setStatus({ status: 'idle', detail: 'Restarting Python' });
  startWorker();
}

function runNow({ code, tests = '', mode = 'test', packages = [] }) {
  warmUp();
  const id = nextId++;
  return new Promise((resolve) => {
    let timer = null;
    pending.set(id, {
      started() {
        timer = setTimeout(() => {
          pending.delete(id);
          restart();
          resolve({ timeout: true, seconds: RUN_TIMEOUT_MS / 1000 });
        }, RUN_TIMEOUT_MS);
      },
      settle(data) {
        clearTimeout(timer);
        pending.delete(id);
        resolve(data.type === 'result' ? data.result : { internalError: data.error });
      },
    });
    worker.postMessage({ type: 'run', id, code, tests, mode, packages });
  });
}

// Runs are queued so only one is ever in flight.
export function runPython(request) {
  const result = queue.then(() => runNow(request));
  queue = result.catch(() => {});
  return result;
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePythonStatus() {
  return useSyncExternalStore(subscribe, () => status);
}
