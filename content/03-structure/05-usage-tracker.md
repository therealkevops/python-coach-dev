---
title: Tracking usage and cost
difficulty: 2
concepts: class state, @property, aggregation
kind: write
---

## Lesson

Every model call costs money, and production code tracks this. A small class that accumulates usage across calls is a common pattern.

`@property` lets you write a method that's *read like an attribute*, with no parentheses. Use it for values computed from the object's state:

```python
class Box:
    def __init__(self, w, h):
        self.w, self.h = w, h

    @property
    def area(self):
        return self.w * self.h

Box(2, 3).area    # 6, no ()
```

A plain class (not a dataclass) defines `__init__` to set up its starting state.

### Task

Write a class `UsageTracker`:

- `__init__(self, input_price, output_price)` stores prices in dollars per million tokens. It also starts `calls = 0`, `input_tokens = 0` and `output_tokens = 0`.
- `record(response)` adds the response's `usage` to the totals and adds 1 to `calls`. A response without `usage` still counts as a call.
- `total_tokens` is a **property** returning input plus output tokens.
- `cost()` returns the total cost in dollars, rounded to 6 places.

## Hints

- `usage = response.get("usage", {})`
- `self.input_tokens += usage.get("input_tokens", 0)`
- `cost = self.input_tokens / 1_000_000 * self.input_price + ...`

## Starter

```python
class UsageTracker:
    def __init__(self, input_price, output_price):
        self.input_price = input_price
        self.output_price = output_price

    def record(self, response):
        pass
```

## Solution

```python
class UsageTracker:
    def __init__(self, input_price, output_price):
        self.input_price = input_price
        self.output_price = output_price
        self.calls = 0
        self.input_tokens = 0
        self.output_tokens = 0

    def record(self, response):
        usage = response.get("usage", {})
        self.calls += 1
        self.input_tokens += usage.get("input_tokens", 0)
        self.output_tokens += usage.get("output_tokens", 0)

    @property
    def total_tokens(self):
        return self.input_tokens + self.output_tokens

    def cost(self):
        dollars = (self.input_tokens / 1_000_000 * self.input_price
                   + self.output_tokens / 1_000_000 * self.output_price)
        return round(dollars, 6)
```

## Tests

```python
def make():
    t = UsageTracker(input_price=3.0, output_price=15.0)
    t.record({"usage": {"input_tokens": 1000, "output_tokens": 200}})
    t.record({"usage": {"input_tokens": 3000, "output_tokens": 800}})
    t.record({"content": []})
    return t

def test_counts():
    """record accumulates calls and tokens"""
    t = make()
    assert t.calls == 3, f"calls is {t.calls}"
    assert (t.input_tokens, t.output_tokens) == (4000, 1000)

def test_total_tokens_property():
    """total_tokens is a property"""
    t = make()
    assert isinstance(type(t).__dict__.get("total_tokens"), property), "make total_tokens a @property"
    assert t.total_tokens == 5000

def test_cost():
    """cost() uses both prices"""
    assert make().cost() == 0.027, f"cost() returned {make().cost()!r}"

def test_fresh_tracker():
    """A new tracker starts at zero"""
    t = UsageTracker(1.0, 1.0)
    assert (t.calls, t.total_tokens, t.cost()) == (0, 0, 0.0)
```
