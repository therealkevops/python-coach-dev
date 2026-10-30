---
title: "Capstone: an Agent class"
difficulty: 3
concepts: classes, agent loop, system prompts, guardrails, traces, usage
kind: build
---

## Lesson

This capstone brings the earlier pieces together into one reusable `Agent` class: the loop, tool dispatch, error results, a step limit, a trace, and usage tracking.

```python
agent = Agent(llm, tools={"search": search}, tool_defs=[...], system="You are a research assistant.")
result = agent.run("Who founded the company that makes the H100?")
result["answer"], result["status"], agent.trace, agent.usage
```

The **system prompt** sets the agent's role and rules. It goes in the `system=` argument on every call, never in `messages`.

Design notes:

- `run()` starts a fresh conversation each time, but the `Agent` object keeps the last run's `messages` and `trace`, so you can inspect them afterwards.
- Usage is added up from every response's `usage` field, the way `UsageTracker` did it in the Structure track.
- Tool errors, including unknown tools, become `is_error` results. They never crash the run.

### Task

Write the class `Agent`:

- `__init__(self, llm, tools, tool_defs, system="", max_steps=8)`
- `run(self, task)`, which resets `self.messages`, `self.trace` and `self.usage` (`{"input_tokens": 0, "output_tokens": 0}`), runs the loop, and returns `{"answer", "status", "steps"}` exactly as in Tracing (the `"trace"` key is not needed)
- On every call, pass `system=self.system` and `tools=self.tool_defs`.
- Each trace entry is `{"step", "tool", "input", "is_error"}`.

## Hints

- Write `_run_tool(self, call)` as a method that wraps unknown tools and exceptions into error results.
- After each `create`: `for k in self.usage: self.usage[k] += response.get("usage", {}).get(k, 0)`
- Keep the conversation in `self.messages` (not a local variable), so tests can inspect it afterwards.

## Starter

```python
import json


class Agent:
    def __init__(self, llm, tools, tool_defs, system="", max_steps=8):
        self.llm = llm

    def run(self, task):
        return {"answer": "", "status": "done", "steps": 0}
```

## Solution

```python
import json


class Agent:
    def __init__(self, llm, tools, tool_defs, system="", max_steps=8):
        self.llm = llm
        self.tools = tools
        self.tool_defs = tool_defs
        self.system = system
        self.max_steps = max_steps
        self.messages = []
        self.trace = []
        self.usage = {"input_tokens": 0, "output_tokens": 0}

    def _run_tool(self, call):
        result = {"type": "tool_result", "tool_use_id": call["id"]}
        fn = self.tools.get(call["name"])
        try:
            if fn is None:
                raise LookupError(f"unknown tool {call['name']!r}")
            value = fn(**call["input"])
            result["content"] = value if isinstance(value, str) else json.dumps(value)
        except Exception as exc:
            result["content"] = f"{type(exc).__name__}: {exc}"
            result["is_error"] = True
        return result

    def run(self, task):
        self.messages = [{"role": "user", "content": task}]
        self.trace = []
        self.usage = {"input_tokens": 0, "output_tokens": 0}
        for step in range(1, self.max_steps + 1):
            response = self.llm.create(messages=self.messages, tools=self.tool_defs, system=self.system)
            for key in self.usage:
                self.usage[key] += response.get("usage", {}).get(key, 0)
            self.messages.append({"role": "assistant", "content": response["content"]})
            if response["stop_reason"] != "tool_use":
                answer = "".join(b["text"] for b in response["content"] if b["type"] == "text")
                return {"answer": answer, "status": "done", "steps": step}
            results = []
            for call in (b for b in response["content"] if b["type"] == "tool_use"):
                result = self._run_tool(call)
                results.append(result)
                self.trace.append({"step": step, "tool": call["name"], "input": call["input"],
                                   "is_error": result.get("is_error", False)})
            self.messages.append({"role": "user", "content": results})
        return {"answer": "", "status": "max_steps", "steps": self.max_steps}
```

## Tests

```python
from mockllm import MockLLM, tool_call, tool_calls, validate_messages

CORPUS = {"h100": "The H100 GPU is made by NVIDIA.", "nvidia": "NVIDIA was founded in 1993 by Jensen Huang, Chris Malachowsky and Curtis Priem."}
TOOLS = {"search": lambda query: CORPUS.get(query.lower(), "no results")}
DEFS = [{"name": "search", "description": "Search notes", "input_schema": {"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]}}]

def script():
    return MockLLM([
        tool_call("search", {"query": "H100"}, text="Searching."),
        tool_calls(("search", {"query": "NVIDIA"}), ("lookup", {"x": 1})),
        "NVIDIA, founded by Jensen Huang, Chris Malachowsky and Curtis Priem.",
    ])

def test_answer():
    """run() answers the task"""
    agent = Agent(script(), TOOLS, DEFS, system="Be precise.")
    result = agent.run("Who founded the company that makes the H100?")
    assert result == {"answer": "NVIDIA, founded by Jensen Huang, Chris Malachowsky and Curtis Priem.", "status": "done", "steps": 3}, f"returned {result!r}"

def test_system_and_tools_every_call():
    """system and tools are sent on every call"""
    llm = script()
    Agent(llm, TOOLS, DEFS, system="Be precise.").run("q")
    assert all(c["system"] == "Be precise." for c in llm.calls), "pass system=self.system on every call"
    assert all(c["tools"] == DEFS for c in llm.calls)

def test_trace_and_unknown_tool():
    """The trace records calls; unknown tools are errors"""
    agent = Agent(script(), TOOLS, DEFS)
    agent.run("q")
    assert [(t["step"], t["tool"], t["is_error"]) for t in agent.trace] == [(1, "search", False), (2, "search", False), (2, "lookup", True)], f"trace: {agent.trace!r}"

def test_messages_kept_and_valid():
    """The final conversation is kept and is valid"""
    agent = Agent(script(), TOOLS, DEFS)
    agent.run("q")
    validate_messages(agent.messages)
    assert len(agent.messages) == 6, f"kept {len(agent.messages)} messages"
    assert agent.messages[-1]["role"] == "assistant"

def test_usage():
    """Usage is added up across calls"""
    llm = MockLLM([dict(tool_call("search", {"query": "h100"}), usage={"input_tokens": 100, "output_tokens": 10}),
                   dict(role="assistant", stop_reason="end_turn", content=[{"type": "text", "text": "ok"}], usage={"input_tokens": 150, "output_tokens": 5})])
    agent = Agent(llm, TOOLS, DEFS)
    agent.run("q")
    assert agent.usage == {"input_tokens": 250, "output_tokens": 15}, f"usage: {agent.usage!r}"

def test_fresh_runs_and_limit():
    """Each run starts fresh, and the step limit holds"""
    agent = Agent(MockLLM([tool_call("search", {"query": "x"})] * 4 + ["fine"]), TOOLS, DEFS, max_steps=2)
    assert agent.run("first")["status"] == "max_steps"
    assert len(agent.trace) == 2
    agent.max_steps = 8
    assert agent.run("second") == {"answer": "fine", "status": "done", "steps": 3}
    assert len(agent.trace) == 2 and agent.messages[0]["content"] == "second"
```
