---
title: The agent loop
difficulty: 3
concepts: agent loop, stop conditions, step limits
kind: write
---

## Lesson

An **agent** is a tool round trip in a loop. The model keeps calling tools, seeing the results and deciding what to do next, until it decides it's finished:

```
messages = [task]
repeat up to max_steps times:
    response = model(messages, tools)
    if response doesn't ask for tools:
        return its text                  <- the model is done
    append the assistant message
    run every tool call, append the results as one user message
give up: the step limit was reached
```

The **step limit** is not optional. Without it, a confused model can loop forever, running up cost on every pass. A "step" here is one model call.

This is the same loop that sits inside most agent frameworks. The frameworks add things around it, but the core is this loop.

### Task

`run_tool` and `text_of` are provided. Write `run_agent(llm, task, tools, tool_defs, max_steps=6)`:

- Run the loop above, passing `tools=tool_defs` on every call.
- Return the final text when the response's `stop_reason` isn't `"tool_use"`.
- If `max_steps` model calls happen without finishing, return `"Stopped: step limit reached"`.

## Hints

- `for step in range(max_steps):` and put the whole round trip inside it.
- Return as soon as `response["stop_reason"] != "tool_use"`.
- After the loop: `return "Stopped: step limit reached"`.

## Starter

```python
import json


def run_tool(call, tools):
    try:
        value = tools[call["name"]](**call["input"])
        result = {"type": "tool_result", "tool_use_id": call["id"],
                  "content": value if isinstance(value, str) else json.dumps(value)}
    except Exception as exc:
        result = {"type": "tool_result", "tool_use_id": call["id"],
                  "content": f"{type(exc).__name__}: {exc}", "is_error": True}
    return result


def text_of(response):
    return "".join(b["text"] for b in response["content"] if b["type"] == "text")


def run_agent(llm, task, tools, tool_defs, max_steps=6):
    messages = [{"role": "user", "content": task}]
    response = llm.create(messages=messages, tools=tool_defs)
    return text_of(response)
```

## Solution

```python
import json


def run_tool(call, tools):
    try:
        value = tools[call["name"]](**call["input"])
        result = {"type": "tool_result", "tool_use_id": call["id"],
                  "content": value if isinstance(value, str) else json.dumps(value)}
    except Exception as exc:
        result = {"type": "tool_result", "tool_use_id": call["id"],
                  "content": f"{type(exc).__name__}: {exc}", "is_error": True}
    return result


def text_of(response):
    return "".join(b["text"] for b in response["content"] if b["type"] == "text")


def run_agent(llm, task, tools, tool_defs, max_steps=6):
    messages = [{"role": "user", "content": task}]
    for _ in range(max_steps):
        response = llm.create(messages=messages, tools=tool_defs)
        if response["stop_reason"] != "tool_use":
            return text_of(response)
        messages.append({"role": "assistant", "content": response["content"]})
        results = [run_tool(b, tools) for b in response["content"] if b["type"] == "tool_use"]
        messages.append({"role": "user", "content": results})
    return "Stopped: step limit reached"
```

## Tests

```python
from mockllm import MockLLM, tool_call, tool_calls

TOOLS = {
    "search": lambda query: {"population of france": "68 million", "population of spain": "48 million"}.get(query, "no results"),
    "add": lambda a, b: a + b,
}
DEFS = [{"name": n, "description": n, "input_schema": {"type": "object", "properties": {}}} for n in TOOLS]

def test_multi_step():
    """Loops through several tool rounds"""
    llm = MockLLM([
        tool_call("search", {"query": "population of france"}),
        tool_call("search", {"query": "population of spain"}),
        tool_call("add", {"a": 68, "b": 48}),
        "Together they have about 116 million people.",
    ])
    result = run_agent(llm, "Combined population of France and Spain?", TOOLS, DEFS)
    assert result == "Together they have about 116 million people.", f"returned {result!r}"
    assert llm.call_count == 4, f"made {llm.call_count} model calls, expected 4"

def test_history_grows():
    """Each call sees the whole conversation so far"""
    llm = MockLLM([tool_call("add", {"a": 1, "b": 2}), tool_call("add", {"a": 3, "b": 3}), "6"])
    run_agent(llm, "q", TOOLS, DEFS)
    lengths = [len(c["messages"]) for c in llm.calls]
    assert lengths == [1, 3, 5], f"message counts per call were {lengths}"
    assert llm.calls[2]["messages"][4]["content"][0]["content"] == "6"

def test_step_limit():
    """Stops at max_steps"""
    llm = MockLLM([tool_call("add", {"a": 1, "b": 1})] * 10)
    result = run_agent(llm, "loop forever", TOOLS, DEFS, max_steps=3)
    assert result == "Stopped: step limit reached", f"returned {result!r}"
    assert llm.call_count == 3, f"made {llm.call_count} calls with max_steps=3"

def test_parallel_and_errors():
    """Parallel calls and tool errors are handled"""
    llm = MockLLM([tool_calls(("search", {"query": "population of france"}), ("add", {"a": 1})), "Done."])
    assert run_agent(llm, "q", TOOLS, DEFS) == "Done."
    results = llm.calls[1]["messages"][2]["content"]
    assert len(results) == 2 and results[1].get("is_error") is True
```
