---
title: Retries with exponential backoff
difficulty: 3
concepts: retry loops, exception hierarchies, dependency injection
kind: write
---

## Lesson

APIs fail now and then: rate limits, overloaded servers. These are **transient** errors, and they usually succeed if you wait and try again. Other errors, such as a malformed request, fail the same way every time, so retrying them only wastes time and money.

**Exponential backoff** doubles the wait after each failure: 0.5s, 1s, 2s, 4s. That gives the service room to recover.

```
attempt 1 -> RateLimitError -> sleep(0.5)
attempt 2 -> RateLimitError -> sleep(1.0)
attempt 3 -> success
```

`except (A, B) as exc:` catches either type. To re-raise the error you just caught, use a bare `raise`.

**Dependency injection.** Real sleeping makes tests slow. Accept the sleep function as a parameter that defaults to `time.sleep`, and tests can pass a fake one that just records the delays.

`mockllm` has two transient errors, `RateLimitError` and `OverloadedError`. Both are subclasses of `APIError`, which is not transient itself.

### Task

Write `call_with_retry(fn, max_attempts=3, base_delay=0.5, sleep=time.sleep)`:

- Call `fn()` and return its result.
- On `RateLimitError` or `OverloadedError`, sleep `base_delay * 2 ** retry_number` (0.5, 1.0, 2.0, ...) and try again.
- After `max_attempts` failed attempts, re-raise the last error. Don't sleep after the final attempt.
- Any other exception propagates immediately, without retrying.

## Hints

- `for attempt in range(max_attempts):` with `try: return fn()` inside.
- In the except block: `if attempt == max_attempts - 1: raise`, otherwise `sleep(base_delay * 2 ** attempt)`.
- Other exceptions propagate on their own as long as you don't catch them.

## Starter

```python
import time
from mockllm import RateLimitError, OverloadedError


def call_with_retry(fn, max_attempts=3, base_delay=0.5, sleep=time.sleep):
    return fn()
```

## Solution

```python
import time
from mockllm import RateLimitError, OverloadedError


def call_with_retry(fn, max_attempts=3, base_delay=0.5, sleep=time.sleep):
    for attempt in range(max_attempts):
        try:
            return fn()
        except (RateLimitError, OverloadedError):
            if attempt == max_attempts - 1:
                raise
            sleep(base_delay * 2 ** attempt)
```

## Tests

```python
from mockllm import MockLLM, RateLimitError, OverloadedError, APIError

def call(llm):
    return lambda: llm.create(messages=[{"role": "user", "content": "hi"}])

def test_retries_then_succeeds():
    """Retries transient errors with doubling delays"""
    llm = MockLLM(["ok"], fail_times=2)
    delays = []
    result = call_with_retry(call(llm), sleep=delays.append)
    assert result["content"][0]["text"] == "ok"
    assert delays == [0.5, 1.0], f"slept {delays!r}"
    assert llm.call_count == 3

def test_overloaded_is_retried():
    """OverloadedError is retried too"""
    llm = MockLLM(["ok"], fail_times=1, error=OverloadedError)
    delays = []
    call_with_retry(call(llm), base_delay=1, sleep=delays.append)
    assert delays == [1], f"slept {delays!r}"

def test_gives_up():
    """After max_attempts the last error is re-raised, with no final sleep"""
    llm = MockLLM(["never"], fail_times=10)
    delays = []
    try:
        call_with_retry(call(llm), max_attempts=4, sleep=delays.append)
    except RateLimitError:
        pass
    else:
        assert False, "expected RateLimitError after 4 attempts"
    assert llm.call_count == 4, f"made {llm.call_count} attempts"
    assert delays == [0.5, 1.0, 2.0], f"slept {delays!r}"

def test_no_retry_on_other_errors():
    """Non-transient errors are not retried"""
    llm = MockLLM([])                     # no replies: create() raises APIError
    delays = []
    try:
        call_with_retry(call(llm), sleep=delays.append)
    except APIError as exc:
        assert not isinstance(exc, RateLimitError)
    assert llm.call_count == 1, f"made {llm.call_count} calls: APIError should not be retried"
    assert delays == []
```
