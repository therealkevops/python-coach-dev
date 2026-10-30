---
title: Tracing what the agent did
difficulty: 3
concepts: traces, observability, returning structured results
kind: write
---

## Lesson

When an agent gives a wrong answer, the first question is *what did it do?* A **trace** records each step, which tools were called with which inputs and whether they failed, so you can debug, test and audit agent behaviour.

Return a structured result instead of a bare string. Callers and tests can then check *how* the answer was reached, not just what it was:

```python
{
    "answer": "...",
    "status": "done",            # or "max_steps"
    "steps": 3,                  # model calls made
    "trace": [
        {"step": 1, "tool": "search", "input": {"query": "..."}, "is_error": False},
        {"step": 2, "tool": "add",    "input": {"a": 1},          "is_error": True},
    ],
}
```

Tracing tools such as OpenTelemetry and LangSmith record the same information, with timing and token counts added.

### Task

Change the agent loop so that `run_agent` returns the dict above:

- `answer` is the final text, or `""` if the step limit was reached.
- `status` is `"done"` or `"max_steps"`.
- `steps` is the number of model calls.
- `trace` has one entry per tool call, in order, recording the step it happened in (counting from 1).

## Hints

- Keep `trace = []` and, after each `run_tool`, append `{"step": step, "tool": call["name"], "input": call["input"], "is_error": result.get("is_error", False)}`.
- `for step in range(1, max_steps + 1):`

## Starter

```python
import json


def run_tool(call, tools):
    try:
        value = tools[call["name"]](**call["input"])
        return {"type": "tool_result", "tool_use_id": call["id"],
                "content": value if isinstance(value, str) else json.dumps(value)}
    except Exception as exc:
        return {"type": "tool_result", "tool_use_id": call["id"],
                "content": f"{type(exc).__name__}: {exc}", "is_error": True}


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

## Solution

```python
import json


def run_tool(call, tools):
    try:
        value = tools[call["name"]](**call["input"])
        return {"type": "tool_result", "tool_use_id": call["id"],
                "content": value if isinstance(value, str) else json.dumps(value)}
    except Exception as exc:
        return {"type": "tool_result", "tool_use_id": call["id"],
                "content": f"{type(exc).__name__}: {exc}", "is_error": True}


def text_of(response):
    return "".join(b["text"] for b in response["content"] if b["type"] == "text")


def run_agent(llm, task, tools, tool_defs, max_steps=6):
    messages = [{"role": "user", "content": task}]
    trace = []
    for step in range(1, max_steps + 1):
        response = llm.create(messages=messages, tools=tool_defs)
        if response["stop_reason"] != "tool_use":
            return {"answer": text_of(response), "status": "done", "steps": step, "trace": trace}
        messages.append({"role": "assistant", "content": response["content"]})
        results = []
        for call in (b for b in response["content"] if b["type"] == "tool_use"):
            result = run_tool(call, tools)
            results.append(result)
            trace.append({"step": step, "tool": call["name"], "input": call["input"],
                          "is_error": result.get("is_error", False)})
        messages.append({"role": "user", "content": results})
    return {"answer": "", "status": "max_steps", "steps": max_steps, "trace": trace}
```

## Tests

```python
from mockllm import MockLLM, tool_call, tool_calls

TOOLS = {"search": lambda query: f"results for {query}", "add": lambda a, b: a + b}
DEFS = [{"name": n, "description": n, "input_schema": {"type": "object", "properties": {}}} for n in TOOLS]

def test_done_result():
    """A finished run reports answer, status and steps"""
    llm = MockLLM([tool_call("search", {"query": "x"}), "Found it."])
    result = run_agent(llm, "q", TOOLS, DEFS)
    assert isinstance(result, dict), f"returned {type(result).__name__}, expected a dict"
    assert result["answer"] == "Found it." and result["status"] == "done" and result["steps"] == 2, f"returned {result!r}"

def test_trace_entries():
    """The trace records each tool call"""
    llm = MockLLM([
        tool_calls(("search", {"query": "a"}), ("add", {"a": 1})),
        tool_call("add", {"a": 1, "b": 2}),
        "3",
    ])
    trace = run_agent(llm, "q", TOOLS, DEFS)["trace"]
    expected = [
        {"step": 1, "tool": "search", "input": {"query": "a"}, "is_error": False},
        {"step": 1, "tool": "add", "input": {"a": 1}, "is_error": True},
        {"step": 2, "tool": "add", "input": {"a": 1, "b": 2}, "is_error": False},
    ]
    assert trace == expected, f"trace was {trace!r}"

def test_max_steps():
    """Hitting the limit reports status max_steps"""
    llm = MockLLM([tool_call("search", {"query": "again"})] * 5)
    result = run_agent(llm, "q", TOOLS, DEFS, max_steps=2)
    assert result["status"] == "max_steps" and result["answer"] == "" and result["steps"] == 2, f"returned {result!r}"
    assert len(result["trace"]) == 2

def test_no_tools():
    """A direct answer has an empty trace"""
    result = run_agent(MockLLM(["hi"]), "q", TOOLS, DEFS)
    assert result == {"answer": "hi", "status": "done", "steps": 1, "trace": []}, f"returned {result!r}"
```
