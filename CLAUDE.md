# pycoach

Static React + Vite app; Python runs in the browser via Pyodide in a Web Worker. No backend.

- Curriculum lives in `content/` (format: `docs/authoring.md`). After changing any challenge, run `npm run test:content`: every solution must pass and every starter must fail.
- `src/py/coach_runner.py` runs in both Pyodide and CPython (`scripts/verify_content.py`). Keep it compatible with both.
- `src/py/mockllm.py` mirrors Anthropic Messages API shapes. Update `docs/mockllm.md` with any API change; the app renders that file.
- UI: dense and quiet. IBM Plex, 1px rules, one accent colour, no shadows, gradients, emoji or large hero blocks. Colours are CSS variables in `src/styles.css`, with light and dark sets.
- Checks before pushing: `npm run lint`, `npm test`, `npm run test:content`; `npm run test:ui` for runtime or UI changes.
