---
title: Joining and formatting text
difficulty: 2
concepts: join, format specifiers, newlines
kind: write
---

## Lesson

`separator.join(list_of_strings)` puts a separator between strings:

```python
", ".join(["a", "b", "c"])     # "a, b, c"
"\n".join(["line 1", "line 2"]) # two lines. "\n" is a newline character.
```

`join` only accepts strings. Convert anything else first, for example with `str(n)` or an f-string.

**Format specifiers** go after a colon inside an f-string's braces:

```python
price = 0.08853
f"{price:.4f}"     # "0.0885"   4 decimal places
f"{1234567:,}"     # "1,234,567"
f"{0.873:.1%}"     # "87.3%"
```

A transcript of a conversation is a common thing to build: for logs, for summaries, or to paste into another prompt.

### Task

- `format_transcript(messages)` returns one line per message, `role: content`, joined with newlines. Example: `"user: Hi\nassistant: Hello"`.
- `format_cost(dollars)` returns a string like `"$0.0885"`, always with 4 decimal places.
- `bullet_list(items)` returns each item on its own line, starting with `"- "`.

## Hints

- Build a list of lines with a comprehension: `[f"{m['role']}: {m['content']}" for m in messages]`.
- Inside an f-string that uses double quotes, use single quotes for dict keys.
- `f"${dollars:.4f}"`. The `$` outside the braces is just text.

## Starter

```python
def format_transcript(messages):
    return ""


def format_cost(dollars):
    return str(dollars)


def bullet_list(items):
    return ""
```

## Solution

```python
def format_transcript(messages):
    return "\n".join(f"{m['role']}: {m['content']}" for m in messages)


def format_cost(dollars):
    return f"${dollars:.4f}"


def bullet_list(items):
    return "\n".join(f"- {item}" for item in items)
```

## Tests

```python
def test_transcript():
    """format_transcript gives one 'role: content' line per message"""
    messages = [{"role": "user", "content": "Hi"}, {"role": "assistant", "content": "Hello"}]
    result = format_transcript(messages)
    assert result == "user: Hi\nassistant: Hello", f"returned {result!r}"

def test_transcript_empty():
    """format_transcript([]) returns ''"""
    assert format_transcript([]) == ""

def test_format_cost():
    """format_cost always shows 4 decimal places"""
    assert format_cost(0.08853) == "$0.0885", f"returned {format_cost(0.08853)!r}"
    assert format_cost(2) == "$2.0000", f"returned {format_cost(2)!r}"

def test_bullet_list():
    """bullet_list prefixes each item with '- '"""
    result = bullet_list(["plan", "act"])
    assert result == "- plan\n- act", f"returned {result!r}"
    assert not result.endswith("\n"), "no trailing newline"
```
