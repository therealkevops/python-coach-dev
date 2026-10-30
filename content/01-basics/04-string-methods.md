---
title: String methods
difficulty: 1
concepts: str methods, strip, lower, split, len, bool
kind: write
---

## Lesson

Strings have **methods**: functions you call with a dot after the value. A method never changes the original string. It returns a new one.

```python
raw = "  Hello World  "
raw.strip()        # "Hello World"    removes spaces from both ends
raw.lower()        # "  hello world  "
raw.upper()        # "  HELLO WORLD  "
raw.replace("World", "Agent")   # "  Hello Agent  "
"a b  c".split()   # ["a", "b", "c"]   splits on any run of whitespace
"report.pdf".endswith(".pdf")   # True
```

You can **chain** methods. Each one works on the result of the one before: `raw.strip().lower()` gives `"hello world"`.

`len(x)` gives the length of a string (in characters) or of a list (in items).

`True` and `False` are **booleans** (`bool`). Methods like `endswith` return them.

Cleaning text like this is the first step before you send user input to a model or compare answers.

### Task

Starting from `raw`, create:

- `cleaned`: `raw` with the surrounding spaces removed, in lowercase
- `word_count`: the number of words in `cleaned`
- `is_question`: `True` if `cleaned` ends with `?`

## Hints

- `cleaned = raw.strip().lower()`
- `cleaned.split()` gives a list of words. `len(...)` of that list is the count.
- `cleaned.endswith("?")` is already `True` or `False`. You don't need an `if`.

## Starter

```python
raw = "   What IS the Capital of France?  "

cleaned = raw
word_count = 0
is_question = False
```

## Solution

```python
raw = "   What IS the Capital of France?  "

cleaned = raw.strip().lower()
word_count = len(cleaned.split())
is_question = cleaned.endswith("?")
```

## Tests

```python
def test_cleaned():
    """cleaned is stripped and lowercase"""
    assert cleaned == "what is the capital of france?", f"cleaned is {cleaned!r}"

def test_word_count():
    """word_count is 6"""
    assert word_count == 6, f"word_count is {word_count!r}"

def test_is_question():
    """is_question is the boolean True"""
    assert is_question is True, f"is_question is {is_question!r}"

def test_raw_unchanged():
    """raw itself is unchanged"""
    assert raw == "   What IS the Capital of France?  "
```
