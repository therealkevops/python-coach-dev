// Pyodide is loaded from the jsDelivr CDN rather than bundled: it is about 10 MB and the
// browser caches it across visits. 0.28.3 ships Python 3.13 and Pydantic 2.
export const PYODIDE_VERSION = '0.28.3';
export const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

// How long learner code may run before the worker is stopped. Package loading doesn't count.
export const RUN_TIMEOUT_MS = 12000;
