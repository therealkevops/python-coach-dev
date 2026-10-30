---
title: JSON in and out
difficulty: 1
concepts: json, loads, dumps, import
kind: write
---

## Lesson

**JSON** is the text format that APIs and models use to exchange data. Python's built-in `json` module converts between JSON text and Python values. `import json` at the top of the file makes it available.

```python
import json

data = json.loads('{"answer": 42, "sources": ["a", "b"]}')   # text -> dict
data["answer"]          # 42

text = json.dumps({"b": 1, "a": 2})                  # dict -> text: '{"b": 1, "a": 2}'
json.dumps({"b": 1, "a": 2}, sort_keys=True)         # '{"a": 2, "b": 1}'
json.dumps(data, indent=2)                           # spread over several lines
```

JSON and Python differ in a few places. JSON's `true`, `false` and `null` become Python's `True`, `False` and `None`, and JSON strings must use double quotes.

`json.loads` raises `json.JSONDecodeError` on invalid JSON. That's a subclass of `ValueError`.

### Task

- `parse_reply(raw)` returns the dict parsed from the JSON string `raw`.
- `answer_of(raw)` returns the `"answer"` value from the JSON, or `None` if it's missing **or** the JSON is invalid.
- `to_json(data)` returns `data` as a JSON string with the keys sorted.

## Hints

- `return json.loads(raw)`
- In `answer_of`, wrap `json.loads` in `try` / `except json.JSONDecodeError:`, then use `.get("answer")`.
- `json.dumps(data, sort_keys=True)`

## Starter

```python
import json


def parse_reply(raw):
    return raw


def answer_of(raw):
    return json.loads(raw)["answer"]


def to_json(data):
    return str(data)
```

## Solution

```python
import json


def parse_reply(raw):
    return json.loads(raw)


def answer_of(raw):
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return None
    return data.get("answer")


def to_json(data):
    return json.dumps(data, sort_keys=True)
```

## Tests

```python
def test_parse_reply():
    """parse_reply converts JSON text to a dict"""
    result = parse_reply('{"answer": 42, "ok": true, "note": null}')
    assert result == {"answer": 42, "ok": True, "note": None}, f"returned {result!r}"

def test_answer_of():
    """answer_of returns the answer"""
    assert answer_of('{"answer": "Paris"}') == "Paris"

def test_answer_of_missing():
    """answer_of returns None when there's no answer key"""
    assert answer_of('{"result": "Paris"}') is None

def test_answer_of_invalid():
    """answer_of returns None for invalid JSON"""
    assert answer_of("The answer is Paris") is None
    assert answer_of("{'answer': 'Paris'}") is None, "single quotes aren't valid JSON"

def test_to_json():
    """to_json sorts keys"""
    result = to_json({"b": 1, "a": [True, None]})
    assert result == '{"a": [true, null], "b": 1}', f"returned {result!r}"
```
