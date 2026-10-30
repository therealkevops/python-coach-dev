---
title: Looping over messages
difficulty: 2
concepts: list of dicts, counting, filtering
kind: write
---

## Lesson

A conversation is a **list of dicts**. Each item is one message:

```python
messages = [
    {"role": "user", "content": "What's 2+2?"},
    {"role": "assistant", "content": "4"},
    {"role": "user", "content": "Thanks"},
]
for message in messages:
    print(message["role"], "->", message["content"])
```

To count things, use a dict as a set of counters. `counts.get(key, 0)` returns 0 for a key you haven't seen yet:

```python
counts = {}
for word in ["a", "b", "a"]:
    counts[word] = counts.get(word, 0) + 1
# {'a': 2, 'b': 1}
```

To filter, loop and `append` only the items you want.

### Task

- `count_roles(messages)` returns a dict mapping each role to how many messages have it, like `{"user": 2, "assistant": 1}`.
- `texts_by_role(messages, role)` returns a list of the `content` of each message with that role, in order.

## Hints

- `counts[message["role"]] = counts.get(message["role"], 0) + 1`
- For `texts_by_role`: `if message["role"] == role:` then append `message["content"]`.

## Starter

```python
def count_roles(messages):
    counts = {}
    return counts


def texts_by_role(messages, role):
    return []
```

## Solution

```python
def count_roles(messages):
    counts = {}
    for message in messages:
        role = message["role"]
        counts[role] = counts.get(role, 0) + 1
    return counts


def texts_by_role(messages, role):
    texts = []
    for message in messages:
        if message["role"] == role:
            texts.append(message["content"])
    return texts
```

## Tests

```python
CONVO = [
    {"role": "user", "content": "What's 2+2?"},
    {"role": "assistant", "content": "4"},
    {"role": "user", "content": "And 3+3?"},
    {"role": "assistant", "content": "6"},
    {"role": "user", "content": "Thanks"},
]

def test_count_roles():
    """count_roles counts each role"""
    result = count_roles(CONVO)
    assert result == {"user": 3, "assistant": 2}, f"returned {result!r}"

def test_count_roles_empty():
    """count_roles([]) returns {}"""
    assert count_roles([]) == {}

def test_texts_by_role():
    """texts_by_role returns contents in order"""
    result = texts_by_role(CONVO, "assistant")
    assert result == ["4", "6"], f"returned {result!r}"

def test_texts_by_role_none():
    """texts_by_role returns [] when nothing matches"""
    assert texts_by_role(CONVO, "system") == []
```
