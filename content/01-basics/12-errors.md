---
title: Errors, try and except
difficulty: 2
concepts: exceptions, try, except, raise, ValueError
kind: write
---

## Lesson

When something goes wrong, Python **raises an exception**: `ValueError`, `KeyError`, `ZeroDivisionError` and so on. Unless something catches it, it stops the program.

`try` / `except` catches it:

```python
try:
    n = int("forty-two")
except ValueError:
    n = None
```

Catch the specific exception you expect, not every possible error. A bare `except:` hides real bugs.

You can **raise** your own exceptions to reject bad input with a clear message:

```python
def set_temperature(t):
    if not 0 <= t <= 1:
        raise ValueError(f"temperature must be between 0 and 1, got {t}")
```

Model output is untrusted text. Parsing it is where most of these errors come from, so you'll use this pattern constantly.

### Task

- `safe_int(text)` returns `int(text)`, or `None` if that raises `ValueError`.
- `safe_divide(a, b)` returns `a / b`, or `None` if `b` is zero.
- `require_field(data, key)` returns `data[key]`. If the key is missing, raise `ValueError` with the message `missing field: <key>`.

## Hints

- Put the risky line inside `try:` and `return None` in the `except ValueError:` block.
- `safe_divide` catches `ZeroDivisionError`.
- In `require_field`: `if key not in data: raise ValueError(f"missing field: {key}")`

## Starter

```python
def safe_int(text):
    return int(text)


def safe_divide(a, b):
    return a / b


def require_field(data, key):
    return data[key]
```

## Solution

```python
def safe_int(text):
    try:
        return int(text)
    except ValueError:
        return None


def safe_divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        return None


def require_field(data, key):
    if key not in data:
        raise ValueError(f"missing field: {key}")
    return data[key]
```

## Tests

```python
def test_safe_int():
    """safe_int parses numbers and returns None for anything else"""
    assert safe_int("42") == 42
    assert safe_int(" 7 ") == 7, "int() ignores surrounding spaces"
    assert safe_int("forty-two") is None
    assert safe_int("") is None

def test_safe_divide():
    """safe_divide returns None when dividing by zero"""
    assert safe_divide(10, 4) == 2.5
    assert safe_divide(1, 0) is None

def test_require_field_present():
    """require_field returns the value"""
    assert require_field({"answer": 4}, "answer") == 4

def test_require_field_missing():
    """require_field raises ValueError('missing field: <key>')"""
    try:
        require_field({}, "answer")
    except ValueError as exc:
        assert str(exc) == "missing field: answer", f"message was {str(exc)!r}"
    except Exception as exc:
        assert False, f"raised {type(exc).__name__}, expected ValueError"
    else:
        assert False, "no exception was raised"
```
