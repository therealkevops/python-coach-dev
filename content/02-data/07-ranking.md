---
title: Ranking with sorted()
difficulty: 2
concepts: sorted, key functions, lambda, tuples
kind: write
---

## Lesson

Retrieval comes down to scoring every document against the query and keeping the best few.

`sorted(items, key=...)` sorts by whatever the **key function** returns for each item. A `lambda` is a small function you write inline:

```python
words = ["banana", "kiwi", "apple"]
sorted(words, key=lambda w: len(w))                 # ['kiwi', 'apple', 'banana']
sorted(words, key=lambda w: len(w), reverse=True)   # longest first
```

To sort by several things, return a **tuple**. Tuples compare item by item. To sort one part descending and another ascending, negate the numeric part:

```python
scores = {"b": 0.9, "a": 0.9, "c": 0.5}
sorted(scores.items(), key=lambda kv: (-kv[1], kv[0]))
# [('a', 0.9), ('b', 0.9), ('c', 0.5)]   highest score first, ties broken by name
```

`dict.items()` gives `(key, value)` pairs. A fixed tie-break makes results **deterministic**, which matters when you test retrieval.

### Task

`cosine` is provided. Write `top_k(query, docs, k)`:

- `docs` maps document ids to vectors.
- Return a list of up to `k` `(doc_id, score)` tuples, highest score first. Break ties by id, alphabetically.
- Round each score to 3 decimal places.

## Hints

- Build the scored list first: `scored = [(doc_id, round(cosine(query, vec), 3)) for doc_id, vec in docs.items()]`.
- `scored.sort(key=lambda item: (-item[1], item[0]))`
- Return `scored[:k]`.

## Starter

```python
import math


def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(x * x for x in b))
    return 0.0 if na == 0 or nb == 0 else dot / (na * nb)


def top_k(query, docs, k):
    return list(docs.items())[:k]
```

## Solution

```python
import math


def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(x * x for x in b))
    return 0.0 if na == 0 or nb == 0 else dot / (na * nb)


def top_k(query, docs, k):
    scored = [(doc_id, round(cosine(query, vec), 3)) for doc_id, vec in docs.items()]
    scored.sort(key=lambda item: (-item[1], item[0]))
    return scored[:k]
```

## Tests

```python
DOCS = {
    "refunds": [0.9, 0.1, 0.0],
    "shipping": [0.1, 0.9, 0.1],
    "returns": [0.8, 0.2, 0.1],
    "careers": [0.0, 0.1, 0.9],
}

def test_order():
    """Highest similarity first"""
    result = top_k([1.0, 0.0, 0.0], DOCS, 2)
    ids = [doc_id for doc_id, _ in result]
    assert ids == ["refunds", "returns"], f"got ids {ids!r}"

def test_scores_rounded():
    """Scores are rounded to 3 places"""
    result = top_k([1.0, 0.0, 0.0], DOCS, 1)
    assert result == [("refunds", 0.994)], f"returned {result!r}"

def test_ties_by_id():
    """Ties are broken alphabetically by id"""
    docs = {"zeta": [1, 0], "alpha": [1, 0], "mid": [0, 1]}
    result = top_k([1, 0], docs, 3)
    assert [d for d, _ in result] == ["alpha", "zeta", "mid"], f"returned {result!r}"

def test_k_larger_than_docs():
    """k larger than the number of docs returns them all"""
    assert len(top_k([1, 0, 0], DOCS, 10)) == 4
```
