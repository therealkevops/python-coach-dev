---
title: Dictionaries
difficulty: 1
concepts: dict, keys, get, copy, mutation
kind: write
---

## Lesson

A **dictionary** (`dict`) maps keys to values. Model APIs use dicts everywhere: a chat message is a dict with `role` and `content` keys.

```python
message = {"role": "user", "content": "Hello"}
message["role"]               # "user"
message["content"] = "Hi"     # change a value
message["name"] = "ada"       # add a new key
"role" in message             # True
message["missing"]            # KeyError!
message.get("missing")        # None, no error
message.get("missing", "?")   # "?", a default of your choice
```

**Mutation.** Assigning a dict to another variable does *not* copy it. Both names point at the same dict:

```python
a = {"x": 1}
b = a
b["x"] = 2
print(a)   # {'x': 2}   a changed too!
```

To get a new dict, copy it with `dict(a)` or `a.copy()`. `{**a, **b}` builds a new dict with the keys of `a` and then `b`, so `b`'s values win where both have the same key.

### Task

- `make_message(role, content)` returns `{"role": role, "content": content}`.
- `get_role(message)` returns the message's role, or `"unknown"` if it has no `"role"` key.
- `merge_settings(defaults, overrides)` returns a **new** dict with all the defaults, replaced by any overrides. It must not change either input.

## Hints

- `return {"role": role, "content": content}`
- `message.get("role", "unknown")`
- `return {**defaults, **overrides}`. Or copy `defaults` and call `.update(overrides)` on the copy.

## Starter

```python
def make_message(role, content):
    return {}


def get_role(message):
    return message["role"]


def merge_settings(defaults, overrides):
    defaults.update(overrides)
    return defaults
```

## Solution

```python
def make_message(role, content):
    return {"role": role, "content": content}


def get_role(message):
    return message.get("role", "unknown")


def merge_settings(defaults, overrides):
    return {**defaults, **overrides}
```

## Tests

```python
def test_make_message():
    """make_message builds a role/content dict"""
    result = make_message("user", "Hi")
    assert result == {"role": "user", "content": "Hi"}, f"returned {result!r}"

def test_get_role():
    """get_role returns the role"""
    assert get_role({"role": "assistant", "content": "x"}) == "assistant"

def test_get_role_missing():
    """get_role returns 'unknown' when there's no role"""
    result = get_role({"content": "x"})
    assert result == "unknown", f"returned {result!r}"

def test_merge_values():
    """merge_settings applies the overrides"""
    result = merge_settings({"temperature": 0.0, "max_tokens": 512}, {"max_tokens": 1024})
    assert result == {"temperature": 0.0, "max_tokens": 1024}, f"returned {result!r}"

def test_merge_does_not_mutate():
    """merge_settings leaves its inputs unchanged"""
    defaults = {"temperature": 0.0, "max_tokens": 512}
    merge_settings(defaults, {"max_tokens": 1024})
    assert defaults == {"temperature": 0.0, "max_tokens": 512}, f"defaults changed to {defaults!r}"
```
