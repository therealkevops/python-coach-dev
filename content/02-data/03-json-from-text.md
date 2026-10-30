---
title: Pulling JSON out of model text
difficulty: 2
concepts: find, rfind, slicing, defensive parsing
kind: write
---

## Lesson

Ask a model for JSON and you often get extra text around it:

````
Sure! Here is the result:
```json
{"city": "Paris", "confidence": 0.9}
```
Let me know if you need anything else.
````

Sometimes there's no code fence at all, just JSON in the middle of a sentence. Your parser has to cope with both.

`text.find(sub)` returns the index where `sub` first appears, or `-1` if it doesn't. `text.rfind(sub)` searches from the end. Combined with slicing, they cut out a piece of text:

```python
s = "abc{x}def"
start = s.find("{")      # 3
end = s.rfind("}")       # 5
s[start:end + 1]         # "{x}"
```

A good defensive parser returns `None` for anything it can't parse, rather than crashing.

### Task

Write `extract_json(text)`:

1. If the text contains a code fence starting with three backticks and `json`, parse only what's between that line and the next closing fence.
2. Otherwise, parse everything from the first `{` to the last `}`.
3. Return the parsed dict, or `None` if there's no JSON or it doesn't parse.

## Hints

- ``FENCE = "`" * 3`` builds the three-backtick string without breaking the editor.
- For the fenced case: `start = text.find(FENCE + "json")`, then skip past that opening line: `start = text.find("\n", start) + 1`, and `end = text.find(FENCE, start)`.
- Put the parse in `try` / `except json.JSONDecodeError: return None`.

## Starter

```python
import json

FENCE = "`" * 3


def extract_json(text):
    return json.loads(text)
```

## Solution

```python
import json

FENCE = "`" * 3


def extract_json(text):
    fenced = text.find(FENCE + "json")
    if fenced != -1:
        start = text.find("\n", fenced) + 1
        end = text.find(FENCE, start)
        candidate = text[start:end] if end != -1 else text[start:]
    else:
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end < start:
            return None
        candidate = text[start:end + 1]
    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        return None
```

## Tests

```python
FENCE = "`" * 3

def test_fenced():
    """Parses JSON inside a json code fence"""
    text = f"Sure! Here it is:\n{FENCE}json\n{{\"city\": \"Paris\", \"confidence\": 0.9}}\n{FENCE}\nAnything else?"
    result = extract_json(text)
    assert result == {"city": "Paris", "confidence": 0.9}, f"returned {result!r}"

def test_fence_ignores_braces_outside():
    """Braces outside the fence are ignored"""
    text = f"Using {{format}}:\n{FENCE}json\n{{\"ok\": true}}\n{FENCE}\n(see {{notes}})"
    assert extract_json(text) == {"ok": True}

def test_bare():
    """Parses JSON embedded in a sentence"""
    result = extract_json('The result is {"answer": 4, "steps": [1, 2]} as requested.')
    assert result == {"answer": 4, "steps": [1, 2]}, f"returned {result!r}"

def test_invalid():
    """Returns None for invalid JSON"""
    assert extract_json("Result: {answer: 4}") is None

def test_no_json():
    """Returns None when there's no JSON at all"""
    assert extract_json("I don't know.") is None
    assert extract_json("} backwards {") is None
```
