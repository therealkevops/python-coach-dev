---
title: Type hints
difficulty: 2
concepts: annotations, return types, Optional, list[str]
kind: write
---

## Lesson

**Type hints** say what types a function expects and returns:

```python
def clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    ...

def first_word(text: str) -> str | None:   # returns a str, or None
    ...

def tags(items: list[str]) -> dict[str, int]:
    ...
```

Python doesn't enforce hints when the code runs. They are for people, editors and checkers such as mypy.

They matter more in AI work than you might expect. Libraries read them at run time to build **tool schemas** and validate data: Pydantic, which comes later in this track, and SDK tool helpers. A function's hints are available as `fn.__annotations__`.

`str | None` means "a string or None". Older code writes it as `Optional[str]`.

### Task

Write these functions **with full type hints** on every parameter and the return value:

- `clamp(value: float, low: float = 0.0, high: float = 1.0) -> float` returns `value` limited to the range from `low` to `high`.
- `first_word(text: str) -> str | None` returns the first word, or `None` if there are no words.
- `word_lengths(words: list[str]) -> dict[str, int]` maps each word to its length.

## Hints

- `return max(low, min(value, high))`
- `parts = text.split()`, then `return parts[0] if parts else None`. That's a conditional expression.
- The tests check `__annotations__`, so every parameter needs a hint, plus `-> ...` for the return type.

## Starter

```python
def clamp(value, low=0.0, high=1.0):
    return value


def first_word(text):
    return text.split()[0]


def word_lengths(words):
    return {}
```

## Solution

```python
def clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(value, high))


def first_word(text: str) -> str | None:
    parts = text.split()
    return parts[0] if parts else None


def word_lengths(words: list[str]) -> dict[str, int]:
    return {word: len(word) for word in words}
```

## Tests

```python
def test_clamp():
    """clamp limits values to the range"""
    assert clamp(1.7) == 1.0
    assert clamp(-0.2) == 0.0
    assert clamp(0.4) == 0.4
    assert clamp(15, 1, 10) == 10

def test_first_word():
    """first_word returns the first word or None"""
    assert first_word("  hello world") == "hello"
    assert first_word("   ") is None

def test_word_lengths():
    """word_lengths maps words to lengths"""
    assert word_lengths(["ab", "cde"]) == {"ab": 2, "cde": 3}

def test_annotations():
    """Every parameter and return value has a type hint"""
    for fn, params in [(clamp, ["value", "low", "high"]), (first_word, ["text"]), (word_lengths, ["words"])]:
        hints = fn.__annotations__
        for name in params + ["return"]:
            assert name in hints, f"{fn.__name__} is missing a type hint for {name!r}"

def test_annotation_types():
    """The hints use the right types"""
    assert clamp.__annotations__["value"] is float
    assert word_lengths.__annotations__["return"] == dict[str, int]
    assert first_word.__annotations__["return"] == (str | None)
```
