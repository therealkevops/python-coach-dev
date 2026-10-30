// Parses challenge files from content/ into objects the app uses.
// The format is described in docs/authoring.md; scripts/verify_content.py parses it the same way.

export const SECTIONS = ['Lesson', 'Hints', 'Starter', 'Solution', 'Tests'];
const SECTION_RE = new RegExp(`^## (${SECTIONS.join('|')})[ \\t]*$`, 'm');
const PATH_RE = /(\d+)-([a-z0-9-]+)\/(\d+)-([a-z0-9-]+)\.md$/;

function parseFrontMatter(text, where) {
  if (!text.startsWith('---\n')) throw new Error(`${where}: must start with a --- front matter block`);
  const end = text.indexOf('\n---\n', 4);
  if (end === -1) throw new Error(`${where}: front matter is not closed`);
  const meta = {};
  for (const line of text.slice(4, end).split('\n')) {
    if (!line.trim()) continue;
    const colon = line.indexOf(':');
    let value = line.slice(colon + 1).trim();
    if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    meta[line.slice(0, colon).trim()] = value;
  }
  return { meta, body: text.slice(end + 5) };
}

function extractCode(body, where, section) {
  const lines = body.split('\n');
  const fences = lines.flatMap((line, i) => (line.startsWith('```') ? [i] : []));
  if (fences.length < 2) throw new Error(`${where}: section ${section} needs a fenced code block`);
  return lines.slice(fences[0] + 1, fences[fences.length - 1]).join('\n') + '\n';
}

const list = (value) => (value ? value.split(',').map((s) => s.trim()).filter(Boolean) : []);

export function parseChallenge(text, where = 'challenge') {
  const { meta, body } = parseFrontMatter(text.replace(/\r\n/g, '\n'), where);
  for (const key of ['title', 'difficulty']) {
    if (!meta[key]) throw new Error(`${where}: front matter needs '${key}'`);
  }
  const parts = body.split(new RegExp(SECTION_RE.source, 'gm'));
  const sections = {};
  for (let i = 1; i < parts.length - 1; i += 2) sections[parts[i]] = parts[i + 1];
  const missing = SECTIONS.filter((s) => !(s in sections));
  if (missing.length) throw new Error(`${where}: missing sections ${missing.join(', ')}`);
  return {
    title: meta.title,
    difficulty: Number(meta.difficulty),
    concepts: list(meta.concepts),
    packages: list(meta.packages),
    kind: meta.kind || 'write',
    lesson: sections.Lesson.trim(),
    hints: sections.Hints.split('\n').filter((l) => l.startsWith('- ')).map((l) => l.slice(2).trim()),
    starter: extractCode(sections.Starter, where, 'Starter'),
    solution: extractCode(sections.Solution, where, 'Solution'),
    tests: extractCode(sections.Tests, where, 'Tests'),
  };
}

// files: { path: rawText } for every content/NN-track/NN-slug.md file.
export function buildCatalog(tracksMeta, files) {
  const byTrack = new Map(tracksMeta.map((t) => [t.id, []]));
  for (const [path, text] of Object.entries(files)) {
    const m = PATH_RE.exec(path);
    if (!m) continue;
    const [, , trackId, num, slug] = m;
    if (!byTrack.has(trackId)) throw new Error(`${path}: track '${trackId}' is not in tracks.json`);
    byTrack.get(trackId).push({ ...parseChallenge(text, path), id: `${trackId}/${slug}`, track: trackId, num: Number(num) });
  }
  const tracks = tracksMeta.map((t, index) => {
    const challenges = byTrack.get(t.id).sort((a, b) => a.num - b.num);
    challenges.forEach((c) => { c.code = `${index + 1}.${String(c.num).padStart(2, '0')}`; });
    return { ...t, index: index + 1, challenges };
  });
  const order = tracks.flatMap((t) => t.challenges);
  const byId = new Map(order.map((c) => [c.id, c]));
  return { tracks, order, byId };
}
