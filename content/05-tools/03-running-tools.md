---
title: Running tools safely
difficulty: 3
concepts: dispatch, tool_result blocks, errors as data
kind: write
---

## Lesson

After running a tool, you send its result back as a `tool_result` block that refers to the call's `id`:

```python
{"type": "tool_result", "tool_use_id": "toolu_01", "content": "18°C, cloudy"}
```

`content` should be a string. If the tool returns a dict or list, convert it to JSON with `json.dumps`.

**Errors are results too.** If the tool doesn't exist or raises an exception, *don't crash the agent*. Send back a result with `"is_error": True` and a short message. The model reads it and can try something else, such as fixing its arguments or using another tool:

```python
{"type": "tool_result", "tool_use_id": "toolu_01", "is_error": True,
 "content": "ValueError: unknown city 'Pariss'"}
```

`tools` here is a dict that maps names to Python functions, like the registry from the Structure track. Call each function with `**call["input"]`.

### Task

Write `run_tool(call, tools)`, which returns a `tool_result` block:

- If the tool isn't in `tools`: `is_error` is `True` and `content` is `"Unknown tool: <name>"`.
- If the tool raises an exception: `is_error` is `True` and `content` is `"<ExceptionType>: <message>"`.
- Otherwise, `content` is the result. Pass a string through as it is, and convert anything else with `json.dumps`. Leave out `is_error`.

## Hints

- Start with `result = {"type": "tool_result", "tool_use_id": call["id"]}`.
- `except Exception as exc:` then `f"{type(exc).__name__}: {exc}"`.
- `isinstance(value, str)` tells you whether the value is already a string.

## Starter

```python
import json


def run_tool(call, tools):
    value = tools[call["name"]](**call["input"])
    return {"type": "tool_result", "content": value}
```

## Solution

```python
import json


def run_tool(call, tools):
    result = {"type": "tool_result", "tool_use_id": call["id"]}
    fn = tools.get(call["name"])
    if fn is None:
        result["content"] = f"Unknown tool: {call['name']}"
        result["is_error"] = True
        return result
    try:
        value = fn(**call["input"])
    except Exception as exc:
        result["content"] = f"{type(exc).__name__}: {exc}"
        result["is_error"] = True
        return result
    result["content"] = value if isinstance(value, str) else json.dumps(value)
    return result
```

## Tests

```python
def weather(city):
    if city != "Paris":
        raise ValueError(f"unknown city {city!r}")
    return {"temp_c": 18, "sky": "cloudy"}

TOOLS = {"weather": weather, "echo": lambda text: text}

def call(name, **inp):
    return {"type": "tool_use", "id": "toolu_9", "name": name, "input": inp}

def test_string_result():
    """String results pass through"""
    result = run_tool(call("echo", text="hi"), TOOLS)
    assert result == {"type": "tool_result", "tool_use_id": "toolu_9", "content": "hi"}, f"returned {result!r}"

def test_json_result():
    """Other results are JSON-encoded"""
    result = run_tool(call("weather", city="Paris"), TOOLS)
    assert result["content"] == '{"temp_c": 18, "sky": "cloudy"}', f"content is {result['content']!r}"
    assert "is_error" not in result

def test_unknown_tool():
    """Unknown tools give an error result"""
    result = run_tool(call("launch_rocket"), TOOLS)
    assert result.get("is_error") is True and result["content"] == "Unknown tool: launch_rocket", f"returned {result!r}"
    assert result["tool_use_id"] == "toolu_9"

def test_tool_exception():
    """Exceptions become error results"""
    result = run_tool(call("weather", city="Pariss"), TOOLS)
    assert result.get("is_error") is True
    assert result["content"] == "ValueError: unknown city 'Pariss'", f"content is {result['content']!r}"

def test_bad_arguments():
    """Wrong arguments are reported, not raised"""
    result = run_tool(call("weather", town="Paris"), TOOLS)
    assert result.get("is_error") is True and result["content"].startswith("TypeError"), f"returned {result!r}"
```
