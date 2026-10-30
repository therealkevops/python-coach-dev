---
title: Timeouts
difficulty: 2
concepts: asyncio.wait_for, TimeoutError, graceful fallback
kind: write
---

## Lesson

A call that hangs can hold up your whole agent. `asyncio.wait_for` gives an awaitable a deadline:

```python
try:
    result = await asyncio.wait_for(slow_call(), timeout=2.0)
except TimeoutError:
    result = None
```

When the deadline passes, `wait_for` **cancels** the call and raises `TimeoutError`. (`asyncio.TimeoutError` is the same class in Python 3.11 and later.)

Decide what a timeout *means* for the caller. Here it means "no answer", so return `None` and let the caller fall back to something else. Don't catch every exception: an `APIError` is a different problem and should propagate.

### Task

Write `async def ask_with_timeout(llm, question, seconds)`. It returns the reply text, or `None` if the call takes longer than `seconds`. Other errors must propagate to the caller.

## Hints

- `response = await asyncio.wait_for(llm.acreate(messages=[...]), timeout=seconds)`
- Catch only `TimeoutError`.

## Starter

```python
import asyncio


async def ask_with_timeout(llm, question, seconds):
    response = await llm.acreate(messages=[{"role": "user", "content": question}])
    return response["content"][0]["text"]
```

## Solution

```python
import asyncio


async def ask_with_timeout(llm, question, seconds):
    try:
        response = await asyncio.wait_for(
            llm.acreate(messages=[{"role": "user", "content": question}]),
            timeout=seconds,
        )
    except TimeoutError:
        return None
    return response["content"][0]["text"]
```

## Tests

```python
import time
from mockllm import MockLLM, APIError

async def test_fast_reply():
    """A fast reply is returned"""
    llm = MockLLM(["quick"], latency=0.01)
    assert await ask_with_timeout(llm, "q", 1.0) == "quick"

async def test_timeout():
    """A slow reply returns None, promptly"""
    llm = MockLLM(["too slow"], latency=2.0)
    started = time.perf_counter()
    result = await ask_with_timeout(llm, "q", 0.1)
    elapsed = time.perf_counter() - started
    assert result is None, f"returned {result!r}"
    assert elapsed < 1.0, f"took {elapsed:.2f}s: it should give up after about 0.1s"

async def test_other_errors_propagate():
    """API errors are not swallowed"""
    llm = MockLLM([], latency=0.0)   # no scripted replies: create() raises APIError
    try:
        await ask_with_timeout(llm, "q", 1.0)
    except APIError:
        return
    assert False, "an APIError should propagate, not be turned into None"
```
