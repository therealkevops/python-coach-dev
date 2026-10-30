// Progress and settings, kept in localStorage. Components read it with useStore().
import { useSyncExternalStore } from 'react';
import { emptyEntry, recordCheck } from './progress.js';

const KEY = 'pycoach:v1';
const DEFAULT_STATE = { version: 1, entries: {}, settings: { theme: 'system', fontSize: 13 }, lastChallenge: null };

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed, settings: { ...DEFAULT_STATE.settings, ...parsed.settings } };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

let state = load();
const listeners = new Set();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage can be full or blocked (private windows). Progress then lasts for this tab only.
  }
}

function set(next) {
  state = next;
  save();
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useStore(selector = (s) => s) {
  return selector(useSyncExternalStore(subscribe, () => state));
}

export const getState = () => state;

function updateEntry(id, fn) {
  const entry = state.entries[id] || emptyEntry();
  set({ ...state, entries: { ...state.entries, [id]: fn(entry) } });
}

export const actions = {
  saveCode(id, code) {
    updateEntry(id, (e) => ({ ...e, code }));
  },
  visit(id) {
    if (state.lastChallenge !== id) set({ ...state, lastChallenge: id });
  },
  showHint(id, count) {
    // Hints only count against XP before the first pass.
    updateEntry(id, (e) => (e.status === 'passed' ? e : { ...e, hintsShown: Math.max(e.hintsShown, count) }));
  },
  viewSolution(id) {
    updateEntry(id, (e) => (e.status === 'passed' ? e : { ...e, solutionViewed: true }));
  },
  check(id, outcome) {
    const before = state.entries[id] || emptyEntry();
    const after = recordCheck(before, { ...outcome, now: Date.now() });
    updateEntry(id, () => after);
    return { before, after };
  },
  setting(key, value) {
    set({ ...state, settings: { ...state.settings, [key]: value } });
  },
  exportJson() {
    return JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2);
  },
  importJson(text) {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed.entries !== 'object') throw new Error('Not a progress file: no "entries" field.');
    set({ ...DEFAULT_STATE, ...parsed, settings: { ...DEFAULT_STATE.settings, ...parsed.settings } });
  },
  reset() {
    set(structuredClone(DEFAULT_STATE));
  },
};
