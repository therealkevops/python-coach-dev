---
title: Comprehensions
difficulty: 2
concepts: list comprehension, dict comprehension, filtering
kind: write
---

## Lesson

A **comprehension** builds a list in one expression. These two are the same:

```python
squares = []
for n in range(5):
    squares.append(n * n)

squares = [n * n for n in range(5)]
```

Add `if` at the end to filter:

```python
evens = [n for n in range(10) if n % 2 == 0]
```

A **dict comprehension** builds a dict the same way:

```python
lengths = {word: len(word) for word in ["plan", "act"]}   # {'plan': 4, 'act': 3}
```

Use a comprehension when the whole loop fits on one readable line. If you need several steps, write a normal loop.

### Task

- `non_empty(lines)` returns each line stripped of surrounding whitespace, leaving out lines that are empty after stripping.
- `lengths(words)` returns a dict mapping each word to its length.
- `tool_names(tools)` takes a list of tool dicts and returns a list of their `"name"` values.

## Hints

- `[line.strip() for line in lines if line.strip()]`. An empty string counts as false.
- `{word: len(word) for word in words}`
- `[tool["name"] for tool in tools]`

## Starter

```python
def non_empty(lines):
    return lines


def lengths(words):
    return {}


def tool_names(tools):
    return []
```

## Solution

```python
def non_empty(lines):
    return [line.strip() for line in lines if line.strip()]


def lengths(words):
    return {word: len(word) for word in words}


def tool_names(tools):
    return [tool["name"] for tool in tools]
```

## Tests

```python
def test_non_empty():
    """non_empty strips lines and drops blank ones"""
    result = non_empty(["  first ", "", "   ", "second", "\tthird\n"])
    assert result == ["first", "second", "third"], f"returned {result!r}"

def test_lengths():
    """lengths maps words to their lengths"""
    assert lengths(["plan", "act"]) == {"plan": 4, "act": 3}
    assert lengths([]) == {}

def test_tool_names():
    """tool_names lists each tool's name"""
    tools = [{"name": "search", "description": "..."}, {"name": "calculator", "description": "..."}]
    assert tool_names(tools) == ["search", "calculator"]
```
