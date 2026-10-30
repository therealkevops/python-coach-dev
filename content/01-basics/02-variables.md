---
title: Variables and f-strings
difficulty: 1
concepts: variables, assignment, f-strings, int, str
kind: write
---

## Lesson

A **variable** is a name for a value. `=` assigns a value to the name, and you can reassign it later.

```python
model = "claude-haiku"   # a str (string)
max_tokens = 1024        # an int (whole number)
max_tokens = 2048        # the name now refers to the new value
```

Names are lowercase with underscores by convention (`max_tokens`, not `MaxTokens`). They are case-sensitive.

An **f-string** puts values inside text. Put `f` before the quote and the variable names in `{braces}`:

```python
name = "Ada"
count = 3
greeting = f"Hi {name}, you have {count} messages"
print(greeting)   # Hi Ada, you have 3 messages
```

Numbers and strings are different types: `512` is a number, `"512"` is text. `type(x)` tells you which one you have.

### Task

1. Create `model` with the value `"claude-haiku"` and `max_tokens` with the number `512`.
2. Create `summary` using an f-string built from those two variables, so it equals `Using claude-haiku with 512 max tokens`.
3. Print `summary`.

## Hints

- `max_tokens = 512` without quotes, so it is a number.
- `summary = f"Using {model} with ..."`. Fill in the rest.
- The last line should be `print(summary)`.

## Starter

```python
model = ""
max_tokens = "512"

summary = "Using model"
```

## Solution

```python
model = "claude-haiku"
max_tokens = 512

summary = f"Using {model} with {max_tokens} max tokens"
print(summary)
```

## Tests

```python
def test_model():
    """model is 'claude-haiku'"""
    assert model == "claude-haiku", f"model is {model!r}"

def test_max_tokens_is_number():
    """max_tokens is the number 512, not the string '512'"""
    assert max_tokens == 512 and type(max_tokens) is int, f"max_tokens is {max_tokens!r} ({type(max_tokens).__name__})"

def test_summary():
    """summary is 'Using claude-haiku with 512 max tokens'"""
    assert summary == "Using claude-haiku with 512 max tokens", f"summary is {summary!r}"

def test_printed():
    """summary is printed"""
    assert "Using claude-haiku with 512 max tokens" in OUTPUT, "nothing matching summary was printed"
```
