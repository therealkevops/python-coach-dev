---
title: Concurrent calls with gather
difficulty: 2
concepts: asyncio.gather, concurrency, unpacking
kind: write
---

## Lesson

Awaiting calls one after another is **sequential**: 5 calls of 1 second each take 5 seconds. `asyncio.gather` starts them all and waits until all have finished, so 5 calls take about 1 second:

```python
import asyncio

results = await asyncio.gather(fetch(a), fetch(b), fetch(c))
```

`gather` returns the results **in the order you passed the coroutines**, whatever order they finish in.

To gather a list, build the coroutines first and unpack the list with `*`:

```python
coros = [fetch(q) for q in questions]   # nothing runs yet
results = await asyncio.gather(*coros)  # all of them run now
```

This is how you summarize 50 documents or run an eval over 200 cases without waiting for each call in turn.

### Task

`ask` is provided. Write `async def ask_all(llm, questions)`, which asks every question **concurrently** and returns the answers as a list, in the same order as the questions.

## Hints

- `return list(await asyncio.gather(*[ask(llm, q) for q in questions]))`
- A `for` loop with `await` inside works, but it's sequential and fails the timing test.

## Starter

```python
import asyncio


async def ask(llm, question):
    response = await llm.acreate(messages=[{"role": "user", "content": question}])
    return response["content"][0]["text"]


async def ask_all(llm, questions):
    answers = []
    for q in questions:
        answers.append(await ask(llm, q))
    return answers
```

## Solution

```python
import asyncio


async def ask(llm, question):
    response = await llm.acreate(messages=[{"role": "user", "content": question}])
    return response["content"][0]["text"]


async def ask_all(llm, questions):
    return list(await asyncio.gather(*[ask(llm, q) for q in questions]))
```

## Tests

```python
import time
from mockllm import MockLLM

def echo_upper(messages, tools):
    return messages[-1]["content"].upper()

async def test_order():
    """Answers come back in question order"""
    llm = MockLLM([echo_upper] * 3)
    result = await ask_all(llm, ["a", "b", "c"])
    assert result == ["A", "B", "C"], f"returned {result!r}"

async def test_concurrent():
    """Calls run at the same time"""
    llm = MockLLM([echo_upper] * 5, latency=0.2)
    started = time.perf_counter()
    await ask_all(llm, ["q1", "q2", "q3", "q4", "q5"])
    elapsed = time.perf_counter() - started
    assert llm.max_in_flight == 5, f"at most {llm.max_in_flight} call(s) ran at once; expected all 5"
    assert elapsed < 0.6, f"took {elapsed:.2f}s; 5 calls of 0.2s each should take about 0.2s"

async def test_empty():
    """No questions gives no answers"""
    assert await ask_all(MockLLM([]), []) == []
```
