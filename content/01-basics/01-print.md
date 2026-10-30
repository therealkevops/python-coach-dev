---
title: print() and strings
difficulty: 1
concepts: print, strings, comments
kind: write
---

## Lesson

A Python program runs from top to bottom, one line at a time. `print()` writes a value to the output, followed by a new line.

```python
print("Hello")         # Hello
print('single quotes work too')
print("Tokens:", 42)   # Tokens: 42   (print puts a space between values)
```

Text in quotes is a **string**. Everything after `#` on a line is a **comment**. Python ignores it.

Output is exact: `"Hello, agent!"` and `"hello, agent!"` are different strings, and so are `"Ready."` and `"Ready"`.

**Running your code.** **Run** (Ctrl+') runs your code and shows what it prints. **Check** (Ctrl+Enter) runs it and then runs the tests. Each test shows a short description and, if it fails, why.

### Task

Print two lines, exactly:

```
Hello, agent!
Ready.
```

## Hints

- You need two separate `print(...)` calls, one per line.
- Check the punctuation: a comma after `Hello`, `!` at the end of line 1, and `.` at the end of line 2.

## Starter

```python
# Print two lines: "Hello, agent!" and then "Ready."
print("Hello")
```

## Solution

```python
print("Hello, agent!")
print("Ready.")
```

## Tests

```python
def test_two_lines():
    """Output is exactly two lines"""
    lines = OUTPUT.strip().splitlines()
    assert len(lines) == 2, f"expected 2 lines of output, got {len(lines)}"

def test_first_line():
    """Line 1 is 'Hello, agent!'"""
    lines = OUTPUT.splitlines() or [""]
    assert lines[0] == "Hello, agent!", f"line 1 is {lines[0]!r}"

def test_second_line():
    """Line 2 is 'Ready.'"""
    lines = OUTPUT.splitlines() + ["", ""]
    assert lines[1] == "Ready.", f"line 2 is {lines[1]!r}"
```
