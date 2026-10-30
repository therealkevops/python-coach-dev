---
title: Lists, indexing and slicing
difficulty: 1
concepts: list, index, append, slicing, None
kind: write
---

## Lesson

A **list** holds values in order. Lists can grow and shrink.

```python
history = ["hi", "hello", "how are you?"]
history[0]       # "hi"            indexes start at 0
history[-1]      # "how are you?"  negative indexes count from the end
len(history)     # 3
history.append("fine")             # adds to the end. Changes the list itself.
```

A **slice** `items[start:stop]` gives a new list from `start` up to, but not including, `stop`. You can leave out either end:

```python
nums = [10, 20, 30, 40, 50]
nums[1:3]    # [20, 30]
nums[:2]     # [10, 20]   the first 2
nums[-2:]    # [40, 50]   the last 2
```

**Watch out:** `nums[-0:]` is the same as `nums[0:]`, which is the *whole* list, because `-0` is just `0`.

Indexing an empty list raises `IndexError`. `None` is Python's "no value". Return it when there is nothing to return.

Chat history is a list of messages, and you often want just the most recent ones.

### Task

- `last_message(messages)` returns the last item, or `None` if the list is empty.
- `add_message(messages, text)` appends `text` to the list and returns the new length.
- `recent(messages, n)` returns a new list of the last `n` items. If `n` is 0, return an empty list.

## Hints

- `if not messages:` is true when a list is empty.
- `messages.append(text)` changes the list. Then `return len(messages)`.
- `messages[-n:]` gives the last n items, except when n is 0. Handle that case first.

## Starter

```python
def last_message(messages):
    return messages[0]


def add_message(messages, text):
    pass


def recent(messages, n):
    return messages
```

## Solution

```python
def last_message(messages):
    if not messages:
        return None
    return messages[-1]


def add_message(messages, text):
    messages.append(text)
    return len(messages)


def recent(messages, n):
    if n <= 0:
        return []
    return messages[-n:]
```

## Tests

```python
def test_last_message():
    """last_message returns the last item"""
    assert last_message(["a", "b", "c"]) == "c"

def test_last_message_empty():
    """last_message([]) returns None"""
    assert last_message([]) is None, "expected None for an empty list"

def test_add_message():
    """add_message appends and returns the new length"""
    history = ["a"]
    result = add_message(history, "b")
    assert history == ["a", "b"], f"list is now {history!r}"
    assert result == 2, f"returned {result!r}, expected 2"

def test_recent():
    """recent returns the last n items"""
    assert recent(["a", "b", "c", "d"], 2) == ["c", "d"]
    assert recent(["a", "b"], 5) == ["a", "b"], "asking for more than exist returns them all"

def test_recent_zero():
    """recent(messages, 0) returns []"""
    result = recent(["a", "b", "c"], 0)
    assert result == [], f"returned {result!r}"
```
