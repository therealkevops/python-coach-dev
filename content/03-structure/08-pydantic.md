---
title: Validating data with Pydantic
difficulty: 3
concepts: pydantic, BaseModel, Field, ValidationError
packages: pydantic
kind: write
---

## Lesson

**Pydantic** turns type hints into validation. You declare a model as a class, and creating one checks and converts the input:

```python
from pydantic import BaseModel, Field, ValidationError

class Order(BaseModel):
    item: str
    quantity: int = Field(default=1, ge=1, le=100)   # 1 to 100

Order(item="pen", quantity="3")      # quantity becomes the int 3
Order.model_validate({"item": "pen"})  # build from a dict; quantity defaults to 1
Order(item="pen", quantity=0)        # raises ValidationError
order.model_dump()                   # back to a dict
```

`ge` means "greater than or equal to" and `le` means "less than or equal to". `ValidationError` lists every problem it found.

You validate at the boundary: when model output, tool arguments or API input enters your code, and before you trust it. The SDKs for most model APIs, and most agent frameworks, are built on Pydantic.

Pydantic loads the first time you run this challenge, so the first run is slower.

### Task

1. Define `SearchQuery` with a required `query: str` and `max_results: int`, which defaults to 5 and must be from 1 to 20.
2. Write `parse_query(data)`, which returns a `SearchQuery` built from the dict, or `None` if validation fails.

## Hints

- `max_results: int = Field(default=5, ge=1, le=20)`
- `try: return SearchQuery.model_validate(data)` and `except ValidationError: return None`

## Starter

```python
from pydantic import BaseModel, Field, ValidationError


class SearchQuery(BaseModel):
    query: str


def parse_query(data):
    return SearchQuery(**data)
```

## Solution

```python
from pydantic import BaseModel, Field, ValidationError


class SearchQuery(BaseModel):
    query: str
    max_results: int = Field(default=5, ge=1, le=20)


def parse_query(data):
    try:
        return SearchQuery.model_validate(data)
    except ValidationError:
        return None
```

## Tests

```python
def test_defaults():
    """max_results defaults to 5"""
    q = parse_query({"query": "refund policy"})
    assert q is not None, "a valid query returned None"
    assert q.query == "refund policy" and q.max_results == 5, f"got {q!r}"

def test_coercion():
    """Numeric strings are converted to int"""
    q = parse_query({"query": "x", "max_results": "3"})
    assert q is not None and q.max_results == 3

def test_range():
    """max_results outside 1 to 20 is rejected"""
    assert parse_query({"query": "x", "max_results": 0}) is None
    assert parse_query({"query": "x", "max_results": 21}) is None
    assert parse_query({"query": "x", "max_results": 20}) is not None

def test_missing_query():
    """A missing query returns None"""
    assert parse_query({"max_results": 3}) is None

def test_model_dump():
    """model_dump round-trips"""
    q = parse_query({"query": "x", "max_results": 2})
    assert q.model_dump() == {"query": "x", "max_results": 2}
```
