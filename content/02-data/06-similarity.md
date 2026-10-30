---
title: Vectors and cosine similarity
difficulty: 2
concepts: zip, math, generator expressions, embeddings
kind: write
---

## Lesson

An **embedding** is a list of numbers (a vector) that represents the meaning of a piece of text. Texts with similar meaning get vectors that point in similar directions. **Cosine similarity** measures that: 1 means the same direction, 0 means unrelated, and -1 means opposite.

```
dot(a, b) = a[0]*b[0] + a[1]*b[1] + ...
norm(a)   = sqrt(dot(a, a))            the vector's length
cosine    = dot(a, b) / (norm(a) * norm(b))
```

`zip(a, b)` pairs up items from two lists, and `sum()` adds up a **generator expression**, a comprehension without the brackets:

```python
a, b = [1, 2, 3], [4, 5, 6]
list(zip(a, b))                      # [(1, 4), (2, 5), (3, 6)]
sum(x * y for x, y in zip(a, b))     # 32
```

`zip` silently stops at the shorter list, which would hide a bug, so check that the lengths match first. `import math` gives you `math.sqrt`.

Real systems use NumPy for this, but it's the same arithmetic.

### Task

- `dot(a, b)` returns the dot product. Raise `ValueError` if the lengths differ.
- `norm(a)` returns the vector's length.
- `cosine(a, b)` returns the cosine similarity, or `0.0` if either vector has length zero.

## Hints

- `if len(a) != len(b): raise ValueError("vectors must be the same length")`
- `norm` can reuse `dot`: `math.sqrt(dot(a, a))`.
- In `cosine`, compute both norms first and `return 0.0` if either is 0.

## Starter

```python
import math


def dot(a, b):
    return sum(x * y for x, y in zip(a, b))


def norm(a):
    return 0.0


def cosine(a, b):
    return dot(a, b)
```

## Solution

```python
import math


def dot(a, b):
    if len(a) != len(b):
        raise ValueError("vectors must be the same length")
    return sum(x * y for x, y in zip(a, b))


def norm(a):
    return math.sqrt(dot(a, a))


def cosine(a, b):
    na, nb = norm(a), norm(b)
    if na == 0 or nb == 0:
        return 0.0
    return dot(a, b) / (na * nb)
```

## Tests

```python
def close(x, y):
    return abs(x - y) < 1e-9

def test_dot():
    """dot multiplies pairs and sums"""
    assert dot([1, 2, 3], [4, 5, 6]) == 32

def test_dot_length_mismatch():
    """dot raises ValueError on different lengths"""
    try:
        dot([1, 2], [1, 2, 3])
    except ValueError:
        return
    assert False, "expected ValueError"

def test_norm():
    """norm is the vector's length"""
    assert close(norm([3, 4]), 5.0), f"norm([3, 4]) returned {norm([3, 4])!r}"

def test_cosine_values():
    """cosine is 1 for same direction, 0 for perpendicular, -1 for opposite"""
    assert close(cosine([1, 2], [2, 4]), 1.0), f"cosine([1, 2], [2, 4]) returned {cosine([1, 2], [2, 4])!r}"
    assert close(cosine([1, 0], [0, 1]), 0.0)
    assert close(cosine([1, 1], [-1, -1]), -1.0)

def test_cosine_zero_vector():
    """cosine with a zero vector is 0.0"""
    assert cosine([0, 0], [1, 1]) == 0.0
```
