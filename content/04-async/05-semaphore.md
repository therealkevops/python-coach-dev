---
title: Limiting concurrency
difficulty: 3
concepts: asyncio.Semaphore, async with, rate limits
kind: write
---

## Lesson

`gather` over 500 items starts 500 requests at once. That hits rate limits and gets your requests rejected. Real batch jobs cap how many requests are **in flight** at a time.

An `asyncio.Semaphore(n)` is a counter of available slots. `async with sem:` waits for a free slot, holds it for the duration of the block, and releases it when the block exits, even if an error is raised:

```python
sem = asyncio.Semaphore(3)

async def limited(item):
    async with sem:           # at most 3 coroutines can be inside here at once
        return await work(item)

results = await asyncio.gather(*[limited(i) for i in items])
```

Create the semaphore inside the function that uses it, not at module level. It has to belong to the event loop that is running.

### Task

Write `async def ask_all_limited(llm, questions, limit)`. It asks all questions with at most `limit` calls in flight at once, and returns the answers in question order.

## Hints

- Create `sem = asyncio.Semaphore(limit)` inside `ask_all_limited`.
- Define a nested `async def one(q):` that does `async with sem:` and then `return await ask(llm, q)`.
- `return list(await asyncio.gather(*[one(q) for q in questions]))`

## Starter

```python
import asyncio


async def ask(llm, question):
    response = await llm.acreate(messages=[{"role": "user", "content": question}])
    return response["content"][0]["text"]


async def ask_all_limited(llm, questions, limit):
    return list(await asyncio.gather(*[ask(llm, q) for q in questions]))
```

## Solution

```python
import asyncio


async def ask(llm, question):
    response = await llm.acreate(messages=[{"role": "user", "content": question}])
    return response["content"][0]["text"]


async def ask_all_limited(llm, questions, limit):
    sem = asyncio.Semaphore(limit)

    async def one(q):
        async with sem:
            return await ask(llm, q)

    return list(await asyncio.gather(*[one(q) for q in questions]))
```

## Tests

```python
from mockllm import MockLLM

def echo(messages, tools):
    return "re: " + messages[-1]["content"]

async def test_limit_respected():
    """No more than `limit` calls run at once"""
    llm = MockLLM([echo] * 8, latency=0.05)
    await ask_all_limited(llm, [f"q{i}" for i in range(8)], 3)
    assert llm.max_in_flight <= 3, f"{llm.max_in_flight} calls ran at once; the limit was 3"

async def test_limit_used():
    """It still runs `limit` calls at a time"""
    llm = MockLLM([echo] * 8, latency=0.05)
    await ask_all_limited(llm, [f"q{i}" for i in range(8)], 3)
    assert llm.max_in_flight == 3, f"only {llm.max_in_flight} at once: the calls aren't concurrent"

async def test_order():
    """Answers come back in question order"""
    llm = MockLLM([echo] * 4, latency=0.01)
    result = await ask_all_limited(llm, ["a", "b", "c", "d"], 2)
    assert result == ["re: a", "re: b", "re: c", "re: d"], f"returned {result!r}"
```
