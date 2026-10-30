// Minimal hash router: #/, #/c/<track>/<slug>[?review], #/review, #/ref, #/settings.
import { useSyncExternalStore } from 'react';

function parse() {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [path, query = ''] = raw.split('?');
  const params = new URLSearchParams(query);
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'c' && parts.length >= 3) {
    return { page: 'challenge', id: `${parts[1]}/${parts[2]}`, review: params.has('review') };
  }
  if (['review', 'ref', 'settings'].includes(parts[0])) return { page: parts[0] };
  return { page: 'path' };
}

let current = parse();
const listeners = new Set();
window.addEventListener('hashchange', () => {
  current = parse();
  listeners.forEach((l) => l());
});

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useRoute() {
  return useSyncExternalStore(subscribe, () => current);
}

export const hrefFor = {
  path: () => '#/',
  challenge: (id, { review = false } = {}) => `#/c/${id}${review ? '?review' : ''}`,
  review: () => '#/review',
  ref: () => '#/ref',
  settings: () => '#/settings',
};

export function navigate(href) {
  window.location.hash = href.replace(/^#/, '');
}
