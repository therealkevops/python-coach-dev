# Writing challenges

Each challenge is one Markdown file in `content/<NN>-<track>/<NN>-<slug>.md`. The number prefixes set the order, and the slug becomes part of the id (`basics/print`). Tracks are listed, in order, in `content/tracks.json`. To add a track, add a folder with the matching name and an entry in that file.

## Format

````markdown
---
title: Short title
difficulty: 1            # 1 beginner, 2 intermediate, 3 advanced; XP is 10 per level
concepts: print, strings # comma-separated; feeds the concept index
packages: pydantic       # optional, Pyodide packages to preload
kind: write              # write | build
---

## Lesson

Markdown. Use ### for sub-headings (## is reserved for the five sections).
End with a "### Task" section that states exactly what to write.

## Hints

- One line each, from gentle to nearly the answer.
- Rendered inline, so `code` works.

## Starter

```python
# What the learner starts with. It must fail at least one test.
```

## Solution

```python
# A reference solution. It must pass every test.
```

## Tests

```python
def test_something():
    """Short description shown in the results list"""
    assert my_function(2) == 4, f"returned {my_function(2)!r}"
```
````

The code in each section is everything between its first and last fence line, so a fenced block can contain backticks inside strings.

## How tests run

`src/py/coach_runner.py` runs the learner's code as `main.py`, then runs the tests in a copy of the same namespace. Tests can call the learner's functions directly, and `OUTPUT` holds everything the learner's code printed.

- Every `test_*` function defined in the tests runs, in source order. `async def` tests are awaited, with a 5-second timeout each.
- A failed `assert` is a FAIL. Its message is shown to the learner, so make the message say what was expected and what was returned. A bare `assert` shows the assert line instead.
- Any other exception is an ERROR. It's shown with the line in the learner's code where it happened, plus a short explanation of that error type.
- The first line of a test's docstring is its label in the results list.

Write tests for a beginner who's reading them: one behaviour per test, and messages that point at the fix.

## Checking your work

```bash
npm run test:content            # every challenge
npm run test:content -- agents/ # only ids containing "agents/"
```

This runs every solution and every starter through the same runner under CPython (3.13, with pydantic installed). `npm run test:ui` also runs every solution through the real app in headless Chromium, which catches differences between CPython and Pyodide.

## mockllm

Agent and tool challenges use `src/py/mockllm.py`, a scripted model with the Anthropic Messages API's shapes. It's documented in `docs/mockllm.md`, which the app also shows on its Reference page. Keep that file in sync when you change the module.
