---
title: for loops
difficulty: 1
concepts: for, range, enumerate, accumulator
kind: write
---

## Lesson

A `for` loop runs its block once for each item in a sequence:

```python
for word in ["plan", "act", "observe"]:
    print(word.upper())
```

A common pattern is the **accumulator**: start a variable before the loop and update it on each pass.

```python
total = 0
for n in [3, 4, 5]:
    total = total + n     # or: total += n
print(total)              # 12
```

`range(n)` gives the numbers 0 to n-1. `enumerate(items)` gives `(index, item)` pairs. `enumerate(items, start=1)` starts counting at 1:

```python
for i, step in enumerate(["plan", "act"], start=1):
    print(f"{i}. {step}")    # 1. plan   then   2. act
```

Python has a built-in `sum()`, but write the loop yourself here. Loops are the basis of everything that follows.

### Task

- `total_tokens(counts)` returns the sum of a list of numbers, using a loop.
- `longest(words)` returns the longest word. If two are the same length, return the first. Return `None` for an empty list.
- `numbered(items)` returns a new list like `["1. plan", "2. act"]`.

## Hints

- For `longest`, keep a `best` variable. Replace it only when a word is *strictly* longer, so the first one wins ties.
- Start `best = None`. In the loop: `if best is None or len(word) > len(best):`
- For `numbered`, start with `result = []` and `append` an f-string on each pass.

## Starter

```python
def total_tokens(counts):
    total = 0
    return total


def longest(words):
    return words[0]


def numbered(items):
    return items
```

## Solution

```python
def total_tokens(counts):
    total = 0
    for count in counts:
        total += count
    return total


def longest(words):
    best = None
    for word in words:
        if best is None or len(word) > len(best):
            best = word
    return best


def numbered(items):
    result = []
    for i, item in enumerate(items, start=1):
        result.append(f"{i}. {item}")
    return result
```

## Tests

```python
def test_total_tokens():
    """total_tokens adds up the counts"""
    assert total_tokens([120, 30, 50]) == 200, f"returned {total_tokens([120, 30, 50])!r}"
    assert total_tokens([]) == 0, "an empty list totals 0"

def test_longest():
    """longest returns the longest word"""
    assert longest(["plan", "observe", "act"]) == "observe"

def test_longest_tie():
    """On a tie, longest returns the first"""
    result = longest(["abc", "xyz", "de"])
    assert result == "abc", f"returned {result!r}"

def test_longest_empty():
    """longest([]) returns None"""
    assert longest([]) is None

def test_numbered():
    """numbered numbers items from 1"""
    result = numbered(["plan", "act", "observe"])
    assert result == ["1. plan", "2. act", "3. observe"], f"returned {result!r}"
```
