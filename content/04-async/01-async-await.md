---
title: async and await
difficulty: 2
concepts: async def, await, coroutines, MockLLM
kind: write
---

## Lesson

A model call spends most of its time **waiting** for the network. Async code lets your program do other work during that wait, for example making other calls.

```python
async def fetch(llm, question):
    response = await llm.acreate(messages=[{"role": "user", "content": question}])
    return response
```

- `async def` defines a **coroutine function**. Calling it doesn't run it. It returns a coroutine object that runs when something awaits it.
- `await` runs the coroutine and pauses *this* function until the result is ready. You can only use `await` inside an `async def`.

In a normal script you start everything with `asyncio.run(main())`. **In this coach, the tests await your functions for you**, so don't call `asyncio.run` yourself.

**MockLLM.** From here on you'll work with `mockllm`, a stand-in for a model API that replays scripted replies. It's built into the coach, and the Reference page documents it. `llm.acreate(...)` is the async version of `llm.create(...)`. Both take `messages=` as a keyword and return a response dict like the ones in the Data track. `llm.calls` records every request your code made.

### Task

Write `async def ask(llm, question)`:

- send one user message containing `question` using `await llm.acreate(messages=...)`
- return the `text` of the first block in the response's `content`

## Hints

- `response = await llm.acreate(messages=[{"role": "user", "content": question}])`
- `return response["content"][0]["text"]`
- Without `await`, `response` is a coroutine object rather than a dict.

## Starter

```python
from mockllm import MockLLM, text


def ask(llm, question):
    response = llm.acreate(messages=[{"role": "user", "content": question}])
    return response


# Try it: Run doesn't await anything for you, but Check does.
```

## Solution

```python
from mockllm import MockLLM, text


async def ask(llm, question):
    response = await llm.acreate(messages=[{"role": "user", "content": question}])
    return response["content"][0]["text"]
```

## Tests

```python
import inspect
from mockllm import MockLLM, text

def test_is_async():
    """ask is an async function"""
    assert inspect.iscoroutinefunction(ask), "define it with 'async def'"

async def test_returns_text():
    """ask returns the reply text"""
    llm = MockLLM(["Paris"])
    result = await ask(llm, "Capital of France?")
    assert result == "Paris", f"returned {result!r}"

async def test_sends_question():
    """ask sends one user message"""
    llm = MockLLM(["ok"])
    await ask(llm, "Hello?")
    assert llm.call_count == 1, f"made {llm.call_count} calls"
    assert llm.calls[0]["messages"] == [{"role": "user", "content": "Hello?"}], f"sent {llm.calls[0]['messages']!r}"
```
