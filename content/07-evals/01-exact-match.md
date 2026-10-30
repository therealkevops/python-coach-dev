---
title: Exact-match scoring
difficulty: 2
concepts: evals, normalization, accuracy, higher-order functions
kind: write
---

## Lesson

You can't improve an AI system you can't measure. An **eval** runs your system on a fixed set of cases with known good answers, and scores the results.

The simplest scorer is **exact match**, but raw strings rarely match exactly. `"Paris."`, `" paris"` and `"PARIS"` are all correct. **Normalize** both sides before you compare:

```python
def normalize(s):
    s = s.lower().strip()
    s = " ".join(s.split())        # collapse runs of whitespace
    return s.rstrip(".!")          # drop trailing punctuation
```

Pass the system under test in as a **function**, so the same eval code works for a prompt, a chain or an agent:

```python
def accuracy(cases, predict):
    ...
accuracy(cases, my_agent)
accuracy(cases, lambda q: "Paris")   # a trivial baseline
```

### Task

- `normalize(s)` lowercases, strips, collapses whitespace runs to one space, and removes any trailing `.` and `!` characters.
- `accuracy(cases, predict)` takes cases of the form `{"input": ..., "expected": ...}`. It calls `predict(case["input"])` for each and returns the fraction that match after normalizing both sides, rounded to 3 places. Return `0.0` if there are no cases.

## Hints

- `" ".join(s.split())` collapses whitespace.
- `s.rstrip(".!")` removes any number of trailing `.` and `!`.
- Count matches with a loop or `sum(1 for c in cases if ...)`.

## Starter

```python
def normalize(s):
    return s


def accuracy(cases, predict):
    correct = sum(1 for c in cases if predict(c["input"]) == c["expected"])
    return correct / len(cases)
```

## Solution

```python
def normalize(s):
    s = " ".join(s.lower().split())
    return s.rstrip(".!")


def accuracy(cases, predict):
    if not cases:
        return 0.0
    correct = sum(1 for c in cases if normalize(predict(c["input"])) == normalize(c["expected"]))
    return round(correct / len(cases), 3)
```

## Tests

```python
CASES = [
    {"input": "capital of France", "expected": "Paris"},
    {"input": "capital of Japan", "expected": "Tokyo"},
    {"input": "capital of Peru", "expected": "Lima"},
]
ANSWERS = {"capital of France": " paris. ", "capital of Japan": "TOKYO!", "capital of Peru": "Cusco"}

def test_normalize():
    """normalize handles case, whitespace and punctuation"""
    assert normalize("  The   Eiffel\nTower.!  ") == "the eiffel tower", f"returned {normalize('  The   Eiffel\\nTower.!  ')!r}"
    assert normalize("U.S.A") == "u.s.a", "only trailing punctuation is removed"

def test_accuracy():
    """accuracy compares normalized answers"""
    result = accuracy(CASES, lambda q: ANSWERS[q])
    assert result == 0.667, f"returned {result!r}"

def test_accuracy_baseline():
    """A constant baseline scores correctly"""
    assert accuracy(CASES, lambda q: "Paris") == 0.333

def test_accuracy_empty():
    """No cases scores 0.0"""
    assert accuracy([], lambda q: q) == 0.0
```
