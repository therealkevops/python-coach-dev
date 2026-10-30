// Static syntax highlighting for Python in lessons and solutions, using the same Lezer
// parser and token classes as the editor so both look the same.
import { pythonLanguage } from '@codemirror/lang-python';
import { highlightCode, classHighlighter } from '@lezer/highlight';

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function highlightPython(code) {
  let html = '';
  const tree = pythonLanguage.parser.parse(code);
  highlightCode(
    code,
    tree,
    classHighlighter,
    (text, classes) => { html += classes ? `<span class="${classes}">${escape(text)}</span>` : escape(text); },
    () => { html += '\n'; },
  );
  return html;
}
