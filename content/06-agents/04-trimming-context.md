---
title: Trimming context safely
difficulty: 3
concepts: context management, protocol invariants, slicing
kind: write
---

## Lesson

A long agent run builds up a long history, and eventually it won't fit in the context window, or it gets slow and expensive. The simplest fix is to keep the **original task** (the first message) plus the most recent messages.

But you can't cut anywhere. The conversation has to stay valid:

- Roles still alternate. The task is a user message, so the kept tail must **start with an assistant message**.
- A `tool_result` can't appear without the `tool_use` it answers. An assistant message always comes before its results, so starting the tail on an assistant message takes care of this too.

```
[0 user task] [1 asst tool_use] [2 user tool_result] [3 asst tool_use] [4 user tool_result] [5 asst text]
keep_last=3 -> tail = [3, 4, 5], which starts with assistant, so this is fine
keep_last=2 -> tail = [4, 5], which starts with a user tool_result: drop 4 -> [5]
```

`mockllm.validate_messages(messages)` raises `APIError` if a conversation is invalid. The tests use it, and you can call it yourself too.

### Task

Write `trim_messages(messages, keep_last)`:

- If there are `keep_last + 1` messages or fewer, return a copy of the list unchanged.
- Otherwise return `[messages[0]]` plus the last `keep_last` messages, after dropping messages from the front of that tail until it starts with an assistant message.
- Don't change the input list.

## Hints

- `tail = messages[-keep_last:] if keep_last > 0 else []`
- `while tail and tail[0]["role"] != "assistant": tail = tail[1:]`
- `return [messages[0]] + tail`

## Starter

```python
def trim_messages(messages, keep_last):
    return [messages[0]] + messages[-keep_last:]
```

## Solution

```python
def trim_messages(messages, keep_last):
    if len(messages) <= keep_last + 1:
        return list(messages)
    tail = messages[-keep_last:] if keep_last > 0 else []
    while tail and tail[0]["role"] != "assistant":
        tail = tail[1:]
    return [messages[0]] + tail
```

## Tests

```python
from mockllm import validate_messages, APIError

def use(i):
    return {"role": "assistant", "content": [{"type": "tool_use", "id": f"t{i}", "name": "search", "input": {}}]}

def result(i):
    return {"role": "user", "content": [{"type": "tool_result", "tool_use_id": f"t{i}", "content": "r"}]}

TASK = {"role": "user", "content": "Research this"}
HISTORY = [TASK, use(1), result(1), use(2), result(2), use(3), result(3), {"role": "assistant", "content": "Done"}]

def test_short_unchanged():
    """Short histories are returned as a copy"""
    out = trim_messages(HISTORY[:3], 5)
    assert out == HISTORY[:3] and out is not HISTORY

def test_clean_cut():
    """Keeps the task plus a tail that starts with assistant"""
    out = trim_messages(HISTORY, 3)
    assert out == [TASK, use(3), result(3), HISTORY[-1]], f"kept roles {[m['role'] for m in out]}"

def test_drops_orphan_result():
    """Never starts the tail on a tool_result"""
    out = trim_messages(HISTORY, 4)
    assert out == [TASK, use(3), result(3), HISTORY[-1]], f"returned {len(out)} messages"

def test_always_valid():
    """Every trim is a valid conversation"""
    for keep in range(0, len(HISTORY) + 1):
        out = trim_messages(HISTORY, keep)
        try:
            validate_messages(out)
        except APIError as exc:
            assert False, f"keep_last={keep}: {exc}"
        assert out[0] is TASK, f"keep_last={keep}: the task must stay first"

def test_input_unchanged():
    """Doesn't change the input"""
    before = list(HISTORY)
    trim_messages(HISTORY, 2)
    assert HISTORY == before
```
