---
title: Reading a model response
difficulty: 2
concepts: nested data, content blocks, get with defaults
kind: write
---

## Lesson

A model API returns a nested structure. With the Anthropic Messages API, a response looks like this:

```python
response = {
    "role": "assistant",
    "stop_reason": "end_turn",
    "content": [
        {"type": "text", "text": "The capital of France "},
        {"type": "text", "text": "is Paris."},
    ],
    "usage": {"input_tokens": 14, "output_tokens": 9},
}
```

`content` is a **list of blocks**. Each block has a `type`. Text blocks hold the reply. Later you'll meet `tool_use` blocks, which are requests to call a tool. So never assume `content[0]` is the text you want: loop over the blocks and check each block's `type`.

Reach into nested data one level at a time: `response["usage"]["input_tokens"]`. Use `.get()` with a default wherever a key might be missing.

### Task

- `extract_text(response)` returns all text blocks' `text` joined together with no separator, skipping any blocks that aren't text.
- `stop_reason(response)` returns the stop reason, or `"unknown"` if it's missing.
- `total_usage(responses)` takes a list of responses and returns `{"input_tokens": ..., "output_tokens": ...}` with the totals. A response without `usage` counts as zero.

## Hints

- `"".join(block["text"] for block in response["content"] if block["type"] == "text")`
- `usage = r.get("usage", {})`, then `usage.get("input_tokens", 0)`.

## Starter

```python
def extract_text(response):
    return response["content"][0]["text"]


def stop_reason(response):
    return response["stop_reason"]


def total_usage(responses):
    return {"input_tokens": 0, "output_tokens": 0}
```

## Solution

```python
def extract_text(response):
    return "".join(
        block["text"] for block in response.get("content", []) if block.get("type") == "text"
    )


def stop_reason(response):
    return response.get("stop_reason", "unknown")


def total_usage(responses):
    totals = {"input_tokens": 0, "output_tokens": 0}
    for r in responses:
        usage = r.get("usage", {})
        totals["input_tokens"] += usage.get("input_tokens", 0)
        totals["output_tokens"] += usage.get("output_tokens", 0)
    return totals
```

## Tests

```python
RESPONSE = {
    "role": "assistant",
    "stop_reason": "tool_use",
    "content": [
        {"type": "text", "text": "Let me check. "},
        {"type": "tool_use", "id": "toolu_1", "name": "search", "input": {"q": "x"}},
        {"type": "text", "text": "One moment."},
    ],
    "usage": {"input_tokens": 20, "output_tokens": 15},
}

def test_extract_text():
    """extract_text joins text blocks and skips the others"""
    result = extract_text(RESPONSE)
    assert result == "Let me check. One moment.", f"returned {result!r}"

def test_extract_text_none():
    """extract_text returns '' when there are no text blocks"""
    assert extract_text({"content": [{"type": "tool_use", "id": "t", "name": "x", "input": {}}]}) == ""

def test_stop_reason():
    """stop_reason reads the field, or returns 'unknown'"""
    assert stop_reason(RESPONSE) == "tool_use"
    assert stop_reason({"content": []}) == "unknown"

def test_total_usage():
    """total_usage adds up usage, treating missing usage as zero"""
    second = {"content": [], "usage": {"input_tokens": 5, "output_tokens": 1}}
    result = total_usage([RESPONSE, second, {"content": []}])
    assert result == {"input_tokens": 25, "output_tokens": 16}, f"returned {result!r}"
```
