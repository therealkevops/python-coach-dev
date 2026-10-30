---
title: A tool registry
difficulty: 3
concepts: decorators that register, dict of functions, **kwargs unpacking
kind: write
---

## Lesson

A decorator doesn't have to wrap anything. It can **register** the function somewhere and return it unchanged. That's how most agent frameworks collect tools:

```python
HANDLERS = {}

def handler(fn):
    HANDLERS[fn.__name__] = fn
    return fn          # return the original, unchanged

@handler
def ping():
    return "pong"

HANDLERS["ping"]()     # "pong"
```

When a model asks to call a tool, you get the tool's name and its arguments as a dict. Look up the function by name, then unpack the dict into keyword arguments with `**`:

```python
args = {"a": 2, "b": 3}
fn(**args)             # same as fn(a=2, b=3)
```

### Task

1. Write a decorator `tool(fn)` that stores `fn` in the `TOOLS` dict under its name and returns `fn`.
2. Use it to register two tools: `add(a, b)`, which returns `a + b`, and `shout(text)`, which returns `text.upper() + "!"`.
3. Write `call_tool(name, args)`, which calls the registered tool with `args` as keyword arguments. If no tool has that name, raise `KeyError(f"unknown tool: {name}")`.

## Hints

- `TOOLS[fn.__name__] = fn` then `return fn`.
- Put `@tool` above `def add(a, b):` and above `def shout(text):`.
- `if name not in TOOLS: raise KeyError(...)`, then `return TOOLS[name](**args)`.

## Starter

```python
TOOLS = {}


def tool(fn):
    return fn


def call_tool(name, args):
    return None
```

## Solution

```python
TOOLS = {}


def tool(fn):
    TOOLS[fn.__name__] = fn
    return fn


@tool
def add(a, b):
    return a + b


@tool
def shout(text):
    return text.upper() + "!"


def call_tool(name, args):
    if name not in TOOLS:
        raise KeyError(f"unknown tool: {name}")
    return TOOLS[name](**args)
```

## Tests

```python
def test_registered():
    """add and shout are registered"""
    assert set(TOOLS) >= {"add", "shout"}, f"TOOLS has {sorted(TOOLS)!r}"

def test_decorator_returns_function():
    """The decorator returns the original function"""
    assert add(2, 3) == 5, "add should still work when called directly"

def test_call_tool():
    """call_tool unpacks args"""
    assert call_tool("add", {"a": 2, "b": 40}) == 42
    assert call_tool("shout", {"text": "hey"}) == "HEY!"

def test_new_tools_register():
    """Tools decorated later are registered too"""
    @tool
    def echo(value):
        return value
    assert call_tool("echo", {"value": 7}) == 7

def test_unknown_tool():
    """Unknown tool names raise KeyError"""
    try:
        call_tool("delete_everything", {})
    except KeyError as exc:
        assert "unknown tool: delete_everything" in str(exc), f"message was {exc}"
    else:
        assert False, "expected KeyError"
```
