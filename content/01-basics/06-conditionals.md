---
title: if, elif, else
difficulty: 1
concepts: if, elif, else, comparison, and, or
kind: write
---

## Lesson

`if` runs a block only when a condition is true. `elif` ("else if") checks another condition when the earlier ones were false, and `else` catches everything left over. Python checks the conditions **in order** and runs only the first block that matches.

```python
def describe(temperature):
    if temperature == 0:
        return "deterministic"
    elif temperature < 0.7:
        return "focused"
    else:
        return "creative"
```

Comparisons: `==` (equal), `!=` (not equal), `<`, `<=`, `>`, `>=`. Combine them with `and`, `or` and `not`. Python also lets you chain them: `0 <= x <= 1`.

Note: `=` assigns a value, `==` compares two values.

A `return` inside an `if` ends the function at that point, so later checks never run.

### Task

Write `confidence_label(score)`:

- `"invalid"` if `score` is below 0 or above 1
- `"high"` if `score` is 0.8 or more
- `"medium"` if `score` is 0.5 or more
- `"low"` otherwise

## Hints

- Check for invalid scores first. Otherwise 1.5 would be labelled "high".
- `if score < 0 or score > 1:`
- Order matters: check `>= 0.8` before `>= 0.5`.

## Starter

```python
def confidence_label(score):
    if score > 0.8:
        return "high"
    return "low"
```

## Solution

```python
def confidence_label(score):
    if score < 0 or score > 1:
        return "invalid"
    elif score >= 0.8:
        return "high"
    elif score >= 0.5:
        return "medium"
    else:
        return "low"
```

## Tests

```python
CASES = [(0.95, "high"), (0.8, "high"), (1.0, "high"), (0.79, "medium"), (0.5, "medium"),
         (0.49, "low"), (0.0, "low"), (-0.1, "invalid"), (1.01, "invalid")]

def test_high():
    """0.8 and above is 'high'"""
    for score, expected in CASES[:3]:
        assert confidence_label(score) == expected, f"confidence_label({score}) returned {confidence_label(score)!r}"

def test_medium():
    """0.5 up to 0.8 is 'medium'"""
    for score, expected in CASES[3:5]:
        assert confidence_label(score) == expected, f"confidence_label({score}) returned {confidence_label(score)!r}"

def test_low():
    """Below 0.5 is 'low'"""
    for score, expected in CASES[5:7]:
        assert confidence_label(score) == expected, f"confidence_label({score}) returned {confidence_label(score)!r}"

def test_invalid():
    """Outside 0 to 1 is 'invalid'"""
    for score, expected in CASES[7:]:
        assert confidence_label(score) == expected, f"confidence_label({score}) returned {confidence_label(score)!r}"
```
