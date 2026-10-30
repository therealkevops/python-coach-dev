---
title: Chunking text
difficulty: 2
concepts: range with step, slicing, validation
kind: write
---

## Lesson

Documents are usually too long to embed or retrieve as a whole, so retrieval-augmented generation (RAG) splits them into **chunks**. **Overlap** repeats a few words between neighbouring chunks, so a sentence that falls on a boundary still appears whole in one of them.

`range(start, stop, step)` counts in steps:

```python
list(range(0, 10, 3))   # [0, 3, 6, 9]
```

With chunks of `size` words that overlap by `overlap` words, each chunk starts `size - overlap` words after the previous one:

```
words:   a b c d e f g
size 3, overlap 1 -> step 2
chunk 1: a b c
chunk 2:     c d e
chunk 3:         e f g
```

Stop once a chunk reaches the end of the text. Otherwise you get extra chunks containing only words that are already in the previous one.

Real systems count tokens rather than words, and split on sentences or headings. The idea is the same.

### Task

Write `chunk_words(text, size, overlap=0)`:

- Return a list of chunks, each a string of up to `size` words joined by single spaces.
- Raise `ValueError` if `size < 1`, or if `overlap` is negative or not smaller than `size`.
- Text with no words returns `[]`.

## Hints

- `words = text.split()` and `step = size - overlap`.
- `for start in range(0, len(words), step):` then `chunk = words[start:start + size]`.
- After appending, `if start + size >= len(words): break`.

## Starter

```python
def chunk_words(text, size, overlap=0):
    words = text.split()
    return [" ".join(words)]
```

## Solution

```python
def chunk_words(text, size, overlap=0):
    if size < 1:
        raise ValueError("size must be at least 1")
    if overlap < 0 or overlap >= size:
        raise ValueError("overlap must be between 0 and size - 1")
    words = text.split()
    chunks = []
    step = size - overlap
    for start in range(0, len(words), step):
        chunks.append(" ".join(words[start:start + size]))
        if start + size >= len(words):
            break
    return chunks
```

## Tests

```python
def test_no_overlap():
    """Chunks without overlap"""
    result = chunk_words("a b c d e", 2)
    assert result == ["a b", "c d", "e"], f"returned {result!r}"

def test_overlap():
    """Chunks with overlap"""
    result = chunk_words("a b c d e f g", 3, overlap=1)
    assert result == ["a b c", "c d e", "e f g"], f"returned {result!r}"

def test_no_redundant_tail():
    """No extra chunk once the end is reached"""
    result = chunk_words("a b c d e", 3, overlap=1)
    assert result == ["a b c", "c d e"], f"returned {result!r}"

def test_short_and_empty():
    """Short text gives one chunk; empty text gives none"""
    assert chunk_words("one two", 5) == ["one two"]
    assert chunk_words("   ", 5) == []

def test_validation():
    """Bad size/overlap raise ValueError"""
    for size, overlap in [(0, 0), (3, 3), (3, 5), (3, -1)]:
        try:
            chunk_words("a b c", size, overlap)
        except ValueError:
            continue
        assert False, f"chunk_words(..., {size}, overlap={overlap}) should raise ValueError"
```
