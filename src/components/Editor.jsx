// CodeMirror 6 editor for Python. Colours come from the same .tok-* classes as lesson code.
import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import {
  EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter,
  drawSelection, rectangularSelection, highlightSpecialChars,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { indentUnit, bracketMatching, indentOnInput, syntaxHighlighting, foldGutter } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap, autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { python } from '@codemirror/lang-python';
import { classHighlighter } from '@lezer/highlight';

export default function Editor({ value, onChange, onCheck, onRun, editorRef, readOnly = false }) {
  const host = useRef(null);
  const view = useRef(null);
  // Latest callbacks, so the editor (created once) always calls the current ones.
  const handlers = useRef({ onChange, onCheck, onRun });
  handlers.current = { onChange, onCheck, onRun };

  useEffect(() => {
    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        foldGutter(),
        highlightSpecialChars(),
        history(),
        drawSelection(),
        rectangularSelection(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        autocompletion({ activateOnTyping: false }),
        highlightActiveLine(),
        highlightSelectionMatches(),
        indentUnit.of('    '),
        EditorState.tabSize.of(4),
        python(),
        syntaxHighlighting(classHighlighter),
        EditorState.readOnly.of(readOnly),
        keymap.of([
          { key: 'Mod-Enter', run: () => { handlers.current.onCheck?.(); return true; } },
          { key: "Mod-'", run: () => { handlers.current.onRun?.(); return true; } },
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...completionKeymap,
          indentWithTab,
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) handlers.current.onChange?.(update.state.doc.toString());
        }),
      ],
    });
    view.current = new EditorView({ state, parent: host.current });
    if (editorRef) {
      editorRef.current = {
        focus: () => view.current.focus(),
        goToLine(line) {
          const doc = view.current.state.doc;
          const target = doc.line(Math.min(Math.max(1, line), doc.lines));
          view.current.dispatch({ selection: { anchor: target.from, head: target.to }, scrollIntoView: true });
          view.current.focus();
        },
      };
    }
    return () => view.current.destroy();
    // The editor is created once per mount; the parent remounts it (via key) for a new document.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className="editor" ref={host} />;
}
