// The curriculum, bundled at build time from content/.
import tracksMeta from '../../content/tracks.json';
import { buildCatalog } from './parse.js';

const files = import.meta.glob('../../content/*/*.md', { query: '?raw', import: 'default', eager: true });

export const catalog = buildCatalog(tracksMeta, files);

// Concept -> the challenges that teach it, for the reference index.
export const conceptIndex = (() => {
  const index = new Map();
  for (const c of catalog.order) {
    for (const concept of c.concepts) {
      if (!index.has(concept)) index.set(concept, []);
      index.get(concept).push(c);
    }
  }
  return [...index.entries()].sort(([a], [b]) => a.localeCompare(b));
})();
