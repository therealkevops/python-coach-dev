---
title: One tool round trip
difficulty: 3
concepts: message protocol, tool_result messages, MockLLM validation
kind: write
---

## Lesson

Here is the full exchange when a model uses a tool:

```
1. you   -> user: "What's the weather in Paris?"                    (+ tool definitions)
2. model -> assistant: [tool_use get_weather {"city": "Paris"}]     stop_reason: tool_use
3. you   -> run the tool
4. you   -> append the assistant message exactly as received
            append a user message whose content is [tool_result ...]
            call the model again with the whole conversation
5. model -> assistant: "It's 18°C and cloudy in Paris."             stop_reason: end_turn
```

The rules the API enforces, which `MockLLM` checks too:

- Roles alternate: user, assistant, user, and so on.
- The assistant message containing `tool_use` goes back into the history **unchanged**, as `{"role": "assistant", "content": response["content"]}`.
- The next user message must contain a `tool_result` for **every** `tool_use` id.
- Pass the same `tools=` definitions on every call.

If you break a rule, `MockLLM` raises `APIError` with a message saying what's wrong.

### Task

`run_tool` is provided. Write `answer_with_tools(llm, question, tools, tool_defs)`:

1. Call `llm.create(messages=..., tools=tool_defs)` with the question.
2. If the model asks for tools, run **all** of them, add the two messages described above, and call the model once more.
3. Return the text of the final response, with all its text blocks joined together.

## Hints

- `messages = [{"role": "user", "content": question}]`
- `messages.append({"role": "assistant", "content": response["content"]})`
- `results = [run_tool(b, tools) for b in response["content"] if b["type"] == "tool_use"]` then `messages.append({"role": "user", "content": results})`.

## Starter

```python
import json


def run_tool(call, tools):
    try:
        value = tools[call["name"]](**call["input"])
        content, is_error = (value if isinstance(value, str) else json.dumps(value)), False
    except Exception as exc:
        content, is_error = f"{type(exc).__name__}: {exc}", True
    result = {"type": "tool_result", "tool_use_id": call["id"], "content": content}
    if is_error:
        result["is_error"] = True
    return result


def answer_with_tools(llm, question, tools, tool_defs):
    response = llm.create(messages=[{"role": "user", "content": question}])
    return response["content"][0]["text"]
```

## Solution

```python
import json


def run_tool(call, tools):
    try:
        value = tools[call["name"]](**call["input"])
        content, is_error = (value if isinstance(value, str) else json.dumps(value)), False
    except Exception as exc:
        content, is_error = f"{type(exc).__name__}: {exc}", True
    result = {"type": "tool_result", "tool_use_id": call["id"], "content": content}
    if is_error:
        result["is_error"] = True
    return result


def text_of(response):
    return "".join(b["text"] for b in response["content"] if b["type"] == "text")


def answer_with_tools(llm, question, tools, tool_defs):
    messages = [{"role": "user", "content": question}]
    response = llm.create(messages=messages, tools=tool_defs)
    if response["stop_reason"] == "tool_use":
        messages.append({"role": "assistant", "content": response["content"]})
        results = [run_tool(b, tools) for b in response["content"] if b["type"] == "tool_use"]
        messages.append({"role": "user", "content": results})
        response = llm.create(messages=messages, tools=tool_defs)
    return text_of(response)
```

## Tests

```python
from mockllm import MockLLM, text, tool_call, tool_calls

DEFS = [{"name": "get_weather", "description": "Weather for a city",
         "input_schema": {"type": "object", "properties": {"city": {"type": "string"}}, "required": ["city"]}}]
TOOLS = {"get_weather": lambda city: {"Paris": "18C cloudy", "Oslo": "4C rain"}[city]}

def test_no_tool_needed():
    """Answers directly when no tool is requested"""
    llm = MockLLM(["Hello!"])
    assert answer_with_tools(llm, "Hi", TOOLS, DEFS) == "Hello!"
    assert llm.call_count == 1

def test_round_trip():
    """Runs the tool and sends the result back"""
    llm = MockLLM([tool_call("get_weather", {"city": "Paris"}, id="toolu_a"), "It's 18C and cloudy."])
    result = answer_with_tools(llm, "Weather in Paris?", TOOLS, DEFS)
    assert result == "It's 18C and cloudy.", f"returned {result!r}"
    assert llm.call_count == 2, f"made {llm.call_count} calls"
    second = llm.calls[1]["messages"]
    assert [m["role"] for m in second] == ["user", "assistant", "user"]
    assert second[2]["content"] == [{"type": "tool_result", "tool_use_id": "toolu_a", "content": "18C cloudy"}], f"tool result message: {second[2]['content']!r}"

def test_tools_sent_every_call():
    """Tool definitions are sent on every call"""
    llm = MockLLM([tool_call("get_weather", {"city": "Oslo"}), "Rainy."])
    answer_with_tools(llm, "Oslo?", TOOLS, DEFS)
    assert all(c["tools"] == DEFS for c in llm.calls), "pass tools=tool_defs on both calls"

def test_parallel_calls():
    """Every call in one response gets a result"""
    llm = MockLLM([tool_calls(("get_weather", {"city": "Paris"}), ("get_weather", {"city": "Oslo"}), text="Checking both."),
                   "Paris is warmer."])
    assert answer_with_tools(llm, "Compare", TOOLS, DEFS) == "Paris is warmer."
    results = llm.calls[1]["messages"][2]["content"]
    assert [r["content"] for r in results] == ["18C cloudy", "4C rain"]

def test_joins_text_blocks():
    """The final answer joins all text blocks"""
    llm = MockLLM([{"role": "assistant", "stop_reason": "end_turn",
                    "content": [{"type": "text", "text": "Part one. "}, {"type": "text", "text": "Part two."}]}])
    assert answer_with_tools(llm, "q", TOOLS, DEFS) == "Part one. Part two."
```
