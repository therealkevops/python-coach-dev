---
title: Functions and return
difficulty: 1
concepts: def, parameters, return, calling functions
kind: write
---

## Lesson

A **function** is a named, reusable piece of code. `def` defines one. The **parameters** in parentheses are the inputs, and `return` sends a result back to the caller.

```python
def add_tax(price, rate):
    total = price * (1 + rate)
    return total

bill = add_tax(100, 0.2)   # calling the function: price=100, rate=0.2
print(bill)                # 120.0
```

The function's body is the indented block under `def`. Use 4 spaces. Indentation is how Python knows which lines belong to the function.

**`return` is not `print`.** `print` shows a value to a person. `return` hands it back to the code that called the function, so that code can use it. A function without `return` returns `None`. From here on, the tests call your functions with their own inputs and check what they return.

A rough rule for estimating tokens: one token is about 4 characters of English.

### Task

Write two functions:

- `count_words(text)` returns the number of words in `text`.
- `estimate_tokens(text)` returns `len(text) // 4`.

## Hints

- Reuse what you learned: `len(text.split())`.
- Make sure each function ends with `return ...`, not `print(...)`.
- `count_words("")` should be `0`, and `"".split()` is already `[]`.

## Starter

```python
def count_words(text):
    print(text)


def estimate_tokens(text):
    pass   # "pass" means "do nothing". Replace it.


print(count_words("hello there agent"))
```

## Solution

```python
def count_words(text):
    return len(text.split())


def estimate_tokens(text):
    return len(text) // 4


print(count_words("hello there agent"))
```

## Tests

```python
def test_count_words_basic():
    """count_words('hello there agent') returns 3"""
    result = count_words("hello there agent")
    assert result == 3, f"returned {result!r}"

def test_count_words_spacing():
    """count_words ignores extra spaces"""
    result = count_words("  spaced    out  ")
    assert result == 2, f"count_words('  spaced    out  ') returned {result!r}"

def test_count_words_empty():
    """count_words('') returns 0"""
    result = count_words("")
    assert result == 0, f"returned {result!r}"

def test_estimate_tokens():
    """estimate_tokens returns len(text) // 4"""
    for text, expected in [("abcd" * 10, 10), ("hi", 0), ("hello world!", 3), ("", 0)]:
        result = estimate_tokens(text)
        assert result == expected, f"estimate_tokens({text!r}) returned {result!r}, expected {expected}"
```
