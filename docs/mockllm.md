## mockllm

`mockllm` is a scripted stand-in for a model API. It lets you practise tool use and agent loops with no network, no API key and no randomness. Requests and responses use the shape of the Anthropic Messages API, as plain dicts.

```python
from mockllm import MockLLM, text, tool_call, tool_calls, APIError, RateLimitError
```

### MockLLM

```python
llm = MockLLM(responses, fail_times=0, error=RateLimitError, latency=0.0)
```

| Argument | Meaning |
|---|---|
| `responses` | The replies, returned in order. Each one is a string (a plain text reply), a dict made with `text()`, `tool_call()` or `tool_calls()`, or a function `(messages, tools) -> reply`. |
| `fail_times` | Raise `error` on this many calls before replying normally. Used to practise retries. |
| `latency` | Seconds `acreate()` waits before replying. Used to practise concurrency. |

```python
response = llm.create(messages=[...], tools=None, system=None, max_tokens=1024, model="mock-1")
response = await llm.acreate(messages=[...], ...)   # async version
```

Arguments are keyword-only, as in the real SDKs. After a run, inspect what your code sent:

| Attribute | Meaning |
|---|---|
| `llm.calls` | One dict per request: `messages`, `tools`, `system`, `max_tokens`, `model` |
| `llm.call_count` | Number of requests made |
| `llm.max_in_flight` | The most `acreate()` calls that were running at once |

### Responses

```python
{"role": "assistant",
 "stop_reason": "end_turn",        # "tool_use" when it wants tools; "max_tokens" if cut off
 "content": [{"type": "text", "text": "..."},
             {"type": "tool_use", "id": "toolu_1", "name": "search", "input": {"query": "..."}}],
 "usage": {"input_tokens": 12, "output_tokens": 3}}
```

| Helper | Builds |
|---|---|
| `text("Hi")` | A text reply with `stop_reason` `"end_turn"` |
| `tool_call("search", {"query": "x"}, id=None, text=None)` | A reply asking for one tool call |
| `tool_calls(("a", {...}), ("b", {...}), text=None)` | A reply asking for several tool calls at once |

### Validation

Like the real API, `create()` rejects a malformed conversation by raising `APIError`, with a message that says what's wrong:

- `messages` must be a non-empty list, and roles must alternate `user`, `assistant`, `user`, ... starting with `user`.
- The system prompt goes in `system=`, never in `messages`.
- Every `tool_use` in an assistant message must be answered by a `tool_result` with the same id in the next user message.
- A `tool_result` must answer a `tool_use` from the message just before it.

`validate_messages(messages)` runs the same checks without making a request.

### Errors

| Class | Meaning |
|---|---|
| `APIError` | The request was rejected. Retrying won't help. |
| `RateLimitError(APIError)` | Too many requests. Wait and retry. |
| `OverloadedError(APIError)` | The service is busy. Wait and retry. |

`estimate_tokens(value)` gives a rough token count, about 4 characters per token.
