---
title: Generators and streaming
difficulty: 3
concepts: yield, generators, async generators, async for
kind: write
---

## Lesson

Models can **stream** their reply: they send it in small chunks as it's generated, so users see text appear immediately. Python models streams as **generators**.

A function that uses `yield` is a generator. Calling it returns an iterator that produces values one at a time, on demand:

```python
def countdown(n):
    while n > 0:
        yield n
        n -= 1

for x in countdown(3):
    print(x)          # 3, 2, 1
list(countdown(3))    # [3, 2, 1]
```

An **async generator** is an `async def` that uses `yield`, and you consume it with `async for`. SDK streaming APIs look like this:

```python
async for chunk in stream:
    print(chunk, end="")
```

### Task

- `stream_chunks(text, size)` is a generator that yields `text` in pieces of `size` characters. The last piece may be shorter.
- `async def collect(stream)` consumes an async stream of text chunks and returns `(full_text, chunk_count)`.

## Hints

- `for i in range(0, len(text), size): yield text[i:i + size]`
- In `collect`: start `parts = []`, then `async for chunk in stream: parts.append(chunk)`.
- `return "".join(parts), len(parts)`

## Starter

```python
def stream_chunks(text, size):
    return [text]


async def collect(stream):
    return "", 0
```

## Solution

```python
def stream_chunks(text, size):
    for i in range(0, len(text), size):
        yield text[i:i + size]


async def collect(stream):
    parts = []
    async for chunk in stream:
        parts.append(chunk)
    return "".join(parts), len(parts)
```

## Tests

```python
import asyncio
import inspect

def test_is_generator():
    """stream_chunks is a generator"""
    assert inspect.isgeneratorfunction(stream_chunks), "use yield inside stream_chunks"

def test_chunks():
    """Chunks have the right size"""
    assert list(stream_chunks("abcdefghij", 4)) == ["abcd", "efgh", "ij"]
    assert list(stream_chunks("", 4)) == []

def test_lazy():
    """Chunks are produced on demand"""
    gen = stream_chunks("abcdef", 2)
    assert next(gen) == "ab"
    assert next(gen) == "cd"

async def test_collect():
    """collect joins an async stream"""
    async def fake_stream():
        for piece in ["The ", "answer ", "is 4."]:
            await asyncio.sleep(0)
            yield piece
    result = await collect(fake_stream())
    assert result == ("The answer is 4.", 3), f"returned {result!r}"
```
