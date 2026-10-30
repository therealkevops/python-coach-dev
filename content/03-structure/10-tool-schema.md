---
title: Tool schemas from functions
difficulty: 3
concepts: inspect.signature, annotations, JSON Schema
kind: write
---

## Lesson

To let a model call a function, you describe it with a **JSON Schema**: the function's name, what it does, and what arguments it takes. Writing these by hand gets tedious and drifts out of date, so many libraries generate them from the function itself, using its name, docstring and type hints.

`inspect.signature(fn).parameters` gives you each parameter. Each one has `.name`, `.annotation` and `.default`, which is `inspect.Parameter.empty` when there's no default:

```python
import inspect

def search(query: str, limit: int = 5):
    """Search the knowledge base."""

for p in inspect.signature(search).parameters.values():
    print(p.name, p.annotation, p.default)
# query <class 'str'> <class 'inspect._empty'>
# limit <class 'int'> 5
```

`inspect.getdoc(fn)` returns the cleaned-up docstring, or `None` if there isn't one.

The schema for `search` should be:

```python
{"name": "search",
 "description": "Search the knowledge base.",
 "input_schema": {"type": "object",
                  "properties": {"query": {"type": "string"}, "limit": {"type": "integer"}},
                  "required": ["query"]}}
```

### Task

Write `tool_schema(fn)`, which builds a schema like the one above:

- `description` is the first line of the docstring, or `""` if there is no docstring.
- Map `str` to `"string"`, `int` to `"integer"`, `float` to `"number"`, `bool` to `"boolean"`, `list` to `"array"` and `dict` to `"object"`. Raise `TypeError` for a parameter with no annotation or one that isn't in this list.
- `required` lists the parameters without defaults, in order.

## Hints

- Keep the mapping in a dict: `TYPES = {str: "string", int: "integer", ...}`.
- `if p.annotation not in TYPES: raise TypeError(f"unsupported type for {p.name}")`
- `if p.default is inspect.Parameter.empty: required.append(p.name)`

## Starter

```python
import inspect


def tool_schema(fn):
    return {"name": fn.__name__}
```

## Solution

```python
import inspect

TYPES = {str: "string", int: "integer", float: "number", bool: "boolean", list: "array", dict: "object"}


def tool_schema(fn):
    properties = {}
    required = []
    for p in inspect.signature(fn).parameters.values():
        if p.annotation not in TYPES:
            raise TypeError(f"unsupported type for {p.name}: {p.annotation!r}")
        properties[p.name] = {"type": TYPES[p.annotation]}
        if p.default is inspect.Parameter.empty:
            required.append(p.name)
    doc = inspect.getdoc(fn)
    return {
        "name": fn.__name__,
        "description": doc.splitlines()[0] if doc else "",
        "input_schema": {"type": "object", "properties": properties, "required": required},
    }
```

## Tests

```python
def search(query: str, limit: int = 5):
    """Search the knowledge base.

    Returns matching passages."""

def convert(amount: float, currency: str, round_result: bool = True, tags: list = None, meta: dict = None):
    pass

def test_search_schema():
    """Schema for a simple function"""
    expected = {
        "name": "search",
        "description": "Search the knowledge base.",
        "input_schema": {"type": "object",
                         "properties": {"query": {"type": "string"}, "limit": {"type": "integer"}},
                         "required": ["query"]},
    }
    result = tool_schema(search)
    assert result == expected, f"returned {result!r}"

def test_all_types():
    """Every supported type maps correctly"""
    props = tool_schema(convert)["input_schema"]["properties"]
    assert [props[k]["type"] for k in props] == ["number", "string", "boolean", "array", "object"], f"properties: {props!r}"
    assert tool_schema(convert)["input_schema"]["required"] == ["amount", "currency"]

def test_no_docstring():
    """A missing docstring gives an empty description"""
    assert tool_schema(convert)["description"] == ""

def test_unsupported():
    """Missing or unsupported annotations raise TypeError"""
    def bad(x):
        pass
    def worse(x: set):
        pass
    for fn in (bad, worse):
        try:
            tool_schema(fn)
        except TypeError:
            continue
        assert False, f"tool_schema({fn.__name__}) should raise TypeError"
```
