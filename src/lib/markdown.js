// Renders lesson markdown. Lessons come from this repository, not from users, so the HTML is trusted.
import { Marked } from 'marked';
import { highlightPython } from './highlight.js';

const marked = new Marked({
  gfm: true,
  renderer: {
    code({ text, lang }) {
      const body = !lang || lang === 'python' || lang === 'py' ? highlightPython(text) : escapeHtml(text);
      return `<pre class="md-code"><code>${body}</code></pre>`;
    },
  },
});

export function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function renderMarkdown(text) {
  return marked.parse(text);
}

export function renderInline(text) {
  return marked.parseInline(text);
}
