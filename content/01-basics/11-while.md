---
title: while loops and break
difficulty: 2
concepts: while, break, loop conditions
kind: write
---

## Lesson

A `while` loop repeats as long as its condition is true. Use it when you don't know in advance how many passes you need: keep calling a model until it's done, keep adding messages until the budget is full.

```python
attempts = 0
while attempts < 3:
    print("trying", attempts)
    attempts += 1
```

If the condition never becomes false, the loop runs forever. Here the coach stops your code after a few seconds.

`break` leaves a loop immediately. It works in `for` loops too:

```python
for word in words:
    if word == "STOP":
        break
    print(word)
```

### Task

- `fit_budget(token_counts, budget)` returns how many items, taken from the start of the list, fit in `budget` without going over. For `[100, 200, 300]` with a budget of 350, the answer is 2. Use a `while` loop.
- `count_until_stop(words)` returns how many words come before the first `"STOP"`. If there is no `"STOP"`, count them all.

## Hints

- Track two things: an index `i` and a running `used` total.
- Loop `while i < len(token_counts) and used + token_counts[i] <= budget:`, then add the count and increase `i`.
- For `count_until_stop`, use a `for` loop with `break`, and count as you go.

## Starter

```python
def fit_budget(token_counts, budget):
    i = 0
    used = 0
    return i


def count_until_stop(words):
    return len(words)
```

## Solution

```python
def fit_budget(token_counts, budget):
    i = 0
    used = 0
    while i < len(token_counts) and used + token_counts[i] <= budget:
        used += token_counts[i]
        i += 1
    return i


def count_until_stop(words):
    count = 0
    for word in words:
        if word == "STOP":
            break
        count += 1
    return count
```

## Tests

```python
def test_fit_budget():
    """fit_budget counts the items that fit"""
    assert fit_budget([100, 200, 300], 350) == 2, f"returned {fit_budget([100, 200, 300], 350)!r}"

def test_fit_budget_exact():
    """An item that exactly fills the budget fits"""
    assert fit_budget([100, 200], 300) == 2

def test_fit_budget_edges():
    """fit_budget handles nothing fitting, and everything fitting"""
    assert fit_budget([500], 100) == 0
    assert fit_budget([1, 2, 3], 1000) == 3
    assert fit_budget([], 10) == 0

def test_fit_budget_stops_at_first_overflow():
    """fit_budget stops at the first item that doesn't fit"""
    assert fit_budget([100, 500, 10], 200) == 1, "items after the one that doesn't fit must not be counted"

def test_count_until_stop():
    """count_until_stop counts the words before STOP"""
    assert count_until_stop(["a", "b", "STOP", "c"]) == 2
    assert count_until_stop(["a", "b"]) == 2
    assert count_until_stop(["STOP"]) == 0
```
