---
title: Default and keyword arguments
difficulty: 2
concepts: default arguments, keyword arguments, **kwargs, mutable defaults
kind: write
---

## Lesson

Parameters can have **default values**, so callers only pass what they want to change. Callers can also name arguments, which makes calls readable:

```python
def build(prompt, model="claude-haiku", temperature=0.0):
    ...

build("Hi")                              # uses both defaults
build("Hi", temperature=0.7)             # keyword argument; skips model
```

`**options` collects any *extra* keyword arguments into a dict. This is how SDK functions accept optional settings:

```python
def show(**options):
    print(options)
show(top_p=0.9, stop=["\n"])    # {'top_p': 0.9, 'stop': ['\n']}
```

**The mutable default trap.** A default value is created *once*, when the function is defined, not on every call. A default list is therefore shared by every call that uses it:

```python
def add(item, items=[]):     # bug!
    items.append(item)
    return items
add("a")   # ['a']
add("b")   # ['a', 'b']   the same list again
```

The fix: default to `None` and create a new list inside the function.

### Task

- `build_request(prompt, model="claude-haiku", max_tokens=1024, **options)` returns a dict with `"model"`, `"max_tokens"`, `"messages"` (a list with one user message containing `prompt`), plus every extra option as its own key.
- `add_tag(tag, tags=None)` returns a list with `tag` appended. If `tags` is given, append to it. If not, start a new list. Calls that don't pass `tags` must not share a list.

## Hints

- `request = {"model": model, "max_tokens": max_tokens, "messages": [...]}` then `request.update(options)`.
- `if tags is None: tags = []`

## Starter

```python
def build_request(prompt, model="claude-haiku", max_tokens=1024):
    return {"model": model, "messages": prompt}


def add_tag(tag, tags=[]):
    tags.append(tag)
    return tags
```

## Solution

```python
def build_request(prompt, model="claude-haiku", max_tokens=1024, **options):
    request = {
        "model": model,
        "max_tokens": max_tokens,
        "messages": [{"role": "user", "content": prompt}],
    }
    request.update(options)
    return request


def add_tag(tag, tags=None):
    if tags is None:
        tags = []
    tags.append(tag)
    return tags
```

## Tests

```python
def test_defaults():
    """build_request uses the defaults"""
    result = build_request("Hi")
    expected = {"model": "claude-haiku", "max_tokens": 1024, "messages": [{"role": "user", "content": "Hi"}]}
    assert result == expected, f"returned {result!r}"

def test_overrides_and_options():
    """build_request accepts keyword overrides and extra options"""
    result = build_request("Hi", max_tokens=50, temperature=0.2, stop_sequences=["END"])
    assert result["max_tokens"] == 50
    assert result["model"] == "claude-haiku"
    assert result.get("temperature") == 0.2, "extra keyword arguments become keys"
    assert result.get("stop_sequences") == ["END"]

def test_add_tag_given_list():
    """add_tag appends to a given list"""
    tags = ["a"]
    assert add_tag("b", tags) == ["a", "b"]

def test_add_tag_no_shared_default():
    """Calls without tags don't share a list"""
    first = add_tag("x")
    second = add_tag("y")
    assert second == ["y"], f"second call returned {second!r}: the default list is being shared"
    assert first == ["x"]
```
