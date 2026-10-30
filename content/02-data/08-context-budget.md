---
title: Fitting a context budget
difficulty: 2
concepts: reversed, accumulators, preserving order
kind: write
---

## Lesson

A model can only read a limited number of tokens: its **context window**. A long chat eventually stops fitting, and the simplest strategy is to keep the most recent messages that fit within a budget.

Work backwards from the newest message and stop at the first one that doesn't fit. Stop there, rather than skipping it and carrying on: a gap in the middle of a conversation confuses the model more than losing older history.

```python
for item in reversed(items):   # newest first
    ...
```

Collecting items backwards gives you a list in reverse order. Reverse it again at the end, or insert each item at the front with `kept.insert(0, item)`, so the result keeps the original order.

### Task

`estimate_tokens(message)` is provided. Write `fit_history(messages, budget)`:

- Return the longest run of the **most recent** messages whose estimated tokens add up to no more than `budget`.
- Keep them in their original order.
- Don't change the input list.

## Hints

- Loop `for message in reversed(messages):`, add each message's cost to a running total, and `break` before going over budget.
- Append the kept messages, then `kept.reverse()` before returning.

## Starter

```python
def estimate_tokens(message):
    return len(message["content"]) // 4 + 4   # +4 for the role and formatting


def fit_history(messages, budget):
    return messages
```

## Solution

```python
def estimate_tokens(message):
    return len(message["content"]) // 4 + 4


def fit_history(messages, budget):
    kept = []
    used = 0
    for message in reversed(messages):
        cost = estimate_tokens(message)
        if used + cost > budget:
            break
        kept.append(message)
        used += cost
    kept.reverse()
    return kept
```

## Tests

```python
def msg(role, n_chars):
    return {"role": role, "content": "x" * n_chars}

# Costs: 104, 24, 14, 54
HISTORY = [msg("user", 400), msg("assistant", 80), msg("user", 40), msg("assistant", 200)]

def test_keeps_most_recent():
    """Keeps the newest messages that fit, in order"""
    result = fit_history(HISTORY, 100)
    assert result == HISTORY[1:], f"kept {len(result)} messages, expected the last 3"

def test_stops_at_first_overflow():
    """Stops at the first message that doesn't fit"""
    history = [msg("user", 0), msg("assistant", 400), msg("user", 0)]
    result = fit_history(history, 20)
    assert result == history[2:], "must not skip a too-big message and keep older ones"

def test_everything_fits():
    """Returns everything when it all fits"""
    assert fit_history(HISTORY, 1000) == HISTORY

def test_nothing_fits():
    """Returns [] when even the last message doesn't fit"""
    assert fit_history(HISTORY, 10) == []

def test_input_unchanged():
    """Doesn't change the input list"""
    history = list(HISTORY)
    fit_history(history, 50)
    assert history == HISTORY
```
