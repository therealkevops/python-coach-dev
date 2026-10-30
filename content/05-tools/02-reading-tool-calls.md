---
title: Reading tool calls
difficulty: 2
concepts: tool_use blocks, stop_reason, filtering
kind: write
---

## Lesson

When the model wants a tool, the response's `stop_reason` is `"tool_use"` and `content` contains one or more `tool_use` blocks, sometimes after some text:

```python
{
    "role": "assistant",
    "stop_reason": "tool_use",
    "content": [
        {"type": "text", "text": "I'll check both cities."},
        {"type": "tool_use", "id": "toolu_01", "name": "get_weather", "input": {"city": "Paris"}},
        {"type": "tool_use", "id": "toolu_02", "name": "get_weather", "input": {"city": "Oslo"}},
    ],
}
```

- `name` is the tool to run, and `input` is a dict of arguments that matches your schema.
- `id` identifies the call. Your result must refer back to it.
- One response can request **several** calls at once, so always handle a list.

`stop_reason` tells you why the model stopped: `"end_turn"` (finished), `"tool_use"` (waiting for tool results) or `"max_tokens"` (cut off).

### Task

- `tool_calls(response)` returns the list of `tool_use` blocks, in order.
- `wants_tools(response)` returns `True` if `stop_reason` is `"tool_use"`.
- `call_summary(response)` returns strings like `"get_weather(city='Paris')"`, one per call. Put the arguments in the order they appear in `input`, separated by `", "`. Format each one as `key=repr(value)`.

## Hints

- `[b for b in response["content"] if b["type"] == "tool_use"]`
- `", ".join(f"{k}={v!r}" for k, v in call["input"].items())`. `!r` gives the repr.

## Starter

```python
def tool_calls(response):
    return response["content"]


def wants_tools(response):
    return len(response["content"]) > 1


def call_summary(response):
    return []
```

## Solution

```python
def tool_calls(response):
    return [b for b in response["content"] if b["type"] == "tool_use"]


def wants_tools(response):
    return response.get("stop_reason") == "tool_use"


def call_summary(response):
    summaries = []
    for call in tool_calls(response):
        args = ", ".join(f"{k}={v!r}" for k, v in call["input"].items())
        summaries.append(f"{call['name']}({args})")
    return summaries
```

## Tests

```python
from mockllm import tool_calls as make_calls, tool_call, text

RESPONSE = make_calls(("get_weather", {"city": "Paris"}), ("convert", {"amount": 3, "to": "EUR"}), text="Checking.")

def test_tool_calls():
    """tool_calls returns only tool_use blocks"""
    calls = tool_calls(RESPONSE)
    assert [c["name"] for c in calls] == ["get_weather", "convert"], f"got {calls!r}"

def test_tool_calls_none():
    """A text-only response has no calls"""
    assert tool_calls(text("Hi")) == []

def test_wants_tools():
    """wants_tools checks stop_reason"""
    assert wants_tools(RESPONSE) is True
    assert wants_tools(text("done")) is False
    assert wants_tools(tool_call("x", {})) is True

def test_call_summary():
    """call_summary formats calls"""
    result = call_summary(RESPONSE)
    assert result == ["get_weather(city='Paris')", "convert(amount=3, to='EUR')"], f"returned {result!r}"
```
