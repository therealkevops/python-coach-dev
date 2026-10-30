---
title: Structured output and error feedback
difficulty: 3
concepts: Literal, model_validate_json, error locations, feedback loops
packages: pydantic
kind: write
---

## Lesson

When you ask a model to return a structure, you validate its answer. If validation fails, a robust system tells the model **exactly which fields were wrong** and asks it to try again.

`Literal` limits a field to a fixed set of values:

```python
from typing import Literal
from pydantic import BaseModel, Field, ValidationError

class Ticket(BaseModel):
    category: Literal["billing", "bug", "other"]
    priority: int = Field(ge=1, le=5)
    summary: str
```

`Ticket.model_validate_json(text)` parses and validates JSON text in one step. On failure, `exc.errors()` returns a list of dicts. Each has a `"loc"` tuple naming the field (`("priority",)`, or a longer path for nested data) and a `"msg"`.

`exc.errors()` is just data. Format it into a short message the model can act on.

### Task

1. Define the `Ticket` model shown above.
2. `parse_ticket(text)` returns a `Ticket`, or `None` if the JSON is invalid or fails validation.
3. `error_fields(text)` returns a sorted list of the field names that failed validation, joined with `.` for nested paths. Return `[]` if the text is valid. Return `["<json>"]` if the text isn't JSON at all.

## Hints

- `model_validate_json` raises `ValidationError` for invalid JSON too. Check `exc.errors()[0]["type"] == "json_invalid"`.
- `".".join(str(part) for part in err["loc"])` turns a location into a name.
- `sorted(set(...))` removes duplicates.

## Starter

```python
from typing import Literal
from pydantic import BaseModel, Field, ValidationError


class Ticket(BaseModel):
    category: str
    priority: int
    summary: str


def parse_ticket(text):
    return Ticket.model_validate_json(text)


def error_fields(text):
    return []
```

## Solution

```python
from typing import Literal
from pydantic import BaseModel, Field, ValidationError


class Ticket(BaseModel):
    category: Literal["billing", "bug", "other"]
    priority: int = Field(ge=1, le=5)
    summary: str


def parse_ticket(text):
    try:
        return Ticket.model_validate_json(text)
    except ValidationError:
        return None


def error_fields(text):
    try:
        Ticket.model_validate_json(text)
    except ValidationError as exc:
        errors = exc.errors()
        if errors and errors[0]["type"] == "json_invalid":
            return ["<json>"]
        return sorted({".".join(str(part) for part in err["loc"]) for err in errors})
    return []
```

## Tests

```python
GOOD = '{"category": "bug", "priority": 2, "summary": "Login fails"}'

def test_parse_good():
    """A valid ticket parses"""
    t = parse_ticket(GOOD)
    assert t is not None and t.category == "bug" and t.priority == 2

def test_parse_bad_category():
    """Unknown categories are rejected"""
    assert parse_ticket('{"category": "feature", "priority": 2, "summary": "x"}') is None

def test_parse_bad_priority():
    """priority must be 1 to 5"""
    assert parse_ticket('{"category": "bug", "priority": 9, "summary": "x"}') is None

def test_error_fields():
    """error_fields names each failing field"""
    result = error_fields('{"category": "feature", "priority": 9}')
    assert result == ["category", "priority", "summary"], f"returned {result!r}"

def test_error_fields_valid_and_not_json():
    """[] for valid input and ['<json>'] for non-JSON"""
    assert error_fields(GOOD) == []
    assert error_fields("Sure! Here's the ticket") == ["<json>"]
```
