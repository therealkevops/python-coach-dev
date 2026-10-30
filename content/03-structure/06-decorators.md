---
title: Functions as values and decorators
difficulty: 3
concepts: first-class functions, closures, decorators, functools.wraps
kind: write
---

## Lesson

In Python, functions are values. You can store them in variables, pass them to other functions, and return them from functions:

```python
def shout(s):
    return s.upper()

f = shout
f("hi")          # "HI"
```

A **decorator** is a function that takes a function and returns a replacement, usually a **wrapper** that adds behaviour around the original. `@decorator` above a `def` is shorthand for `fn = decorator(fn)`:

```python
import functools

def timed(fn):
    @functools.wraps(fn)                 # keep fn's name and docstring
    def wrapper(*args, **kwargs):        # accept any arguments...
        print("calling", fn.__name__)
        return fn(*args, **kwargs)       # ...and pass them through
    return wrapper

@timed
def add(a, b):
    return a + b
```

`*args` collects positional arguments into a tuple and `**kwargs` collects keyword arguments into a dict. Using both lets a wrapper fit any function.

Agent frameworks use decorators everywhere: `@tool` to register tools, `@retry`, `@traced`.

### Task

Write a decorator `logged(fn)`. Each time the decorated function is called, it appends the function's name to the global list `CALL_LOG`, then calls the function and returns its result. Use `functools.wraps` so the decorated function keeps its `__name__` and docstring.

## Hints

- Inside `wrapper`: `CALL_LOG.append(fn.__name__)` then `return fn(*args, **kwargs)`.
- Put `@functools.wraps(fn)` directly above `def wrapper`.
- `logged` itself must `return wrapper`, without calling it.

## Starter

```python
import functools

CALL_LOG = []


def logged(fn):
    return fn
```

## Solution

```python
import functools

CALL_LOG = []


def logged(fn):
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        CALL_LOG.append(fn.__name__)
        return fn(*args, **kwargs)
    return wrapper
```

## Tests

```python
def test_logs_calls():
    """Each call is logged by name"""
    CALL_LOG.clear()

    @logged
    def greet(name):
        return f"hi {name}"

    greet("a")
    greet("b")
    assert CALL_LOG == ["greet", "greet"], f"CALL_LOG is {CALL_LOG!r}"

def test_passes_arguments_and_result():
    """Arguments and the return value pass through"""
    @logged
    def power(base, exp=2):
        return base ** exp

    assert power(3) == 9
    assert power(2, exp=5) == 32

def test_wraps():
    """The wrapper keeps the function's name and docstring"""
    @logged
    def search(query):
        """Search the docs."""
        return query

    assert search.__name__ == "search", f"__name__ is {search.__name__!r}: use functools.wraps"
    assert search.__doc__ == "Search the docs."

def test_logged_on_call_not_definition():
    """Nothing is logged until the function is called"""
    CALL_LOG.clear()

    @logged
    def unused():
        return 1

    assert CALL_LOG == [], "decorating should not call the function"
```
