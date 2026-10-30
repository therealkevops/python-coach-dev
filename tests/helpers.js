// Loads the curriculum from content/ in Node, the way the app's bundler does.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { buildCatalog } from '../src/content/parse.js';

export const ROOT = new URL('..', import.meta.url).pathname;

export function contentFiles() {
  const dir = join(ROOT, 'content');
  const files = {};
  for (const folder of readdirSync(dir, { withFileTypes: true })) {
    if (!folder.isDirectory()) continue;
    for (const name of readdirSync(join(dir, folder.name))) {
      if (name.endsWith('.md')) files[`content/${folder.name}/${name}`] = readFileSync(join(dir, folder.name, name), 'utf8');
    }
  }
  return files;
}

export function loadCatalog() {
  const tracks = JSON.parse(readFileSync(join(ROOT, 'content', 'tracks.json'), 'utf8'));
  return buildCatalog(tracks, contentFiles());
}
