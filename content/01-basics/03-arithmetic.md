---
title: Numbers and arithmetic
difficulty: 1
concepts: int, float, arithmetic, round
kind: write
---

## Lesson

Python has whole numbers (`int`) and decimal numbers (`float`).

| Operator | Meaning | Example | Result |
|---|---|---|---|
| `+ - *` | add, subtract, multiply | `3 * 4` | `12` |
| `/` | divide (always a float) | `7 / 2` | `3.5` |
| `//` | divide, round down | `7 // 2` | `3` |
| `%` | remainder | `7 % 2` | `1` |
| `**` | power | `2 ** 10` | `1024` |

You can write large numbers with underscores to make them readable: `1_000_000` is one million.

Floats are approximate, so `0.1 + 0.2` gives `0.30000000000000004`. `round(x, 4)` rounds to 4 decimal places.

Model APIs charge per **million tokens**, with different prices for input (what you send) and output (what the model writes):

```python
cost = tokens / 1_000_000 * price_per_million
```

### Task

The starter gives you token counts and prices in dollars per million tokens. Calculate:

- `input_cost`: the cost of the input tokens
- `output_cost`: the cost of the output tokens
- `total_cost`: the sum of the two, rounded to 4 decimal places

## Hints

- `input_cost = input_tokens / 1_000_000 * input_price`
- `total_cost = round(input_cost + output_cost, 4)`

## Starter

```python
input_tokens = 12_000
output_tokens = 3_500
input_price = 3.00     # dollars per million input tokens
output_price = 15.00   # dollars per million output tokens

input_cost = 0
output_cost = 0
total_cost = 0
```

## Solution

```python
input_tokens = 12_000
output_tokens = 3_500
input_price = 3.00
output_price = 15.00

input_cost = input_tokens / 1_000_000 * input_price
output_cost = output_tokens / 1_000_000 * output_price
total_cost = round(input_cost + output_cost, 4)
```

## Tests

```python
def test_input_cost():
    """input_cost is $0.036"""
    assert abs(input_cost - 0.036) < 1e-9, f"input_cost is {input_cost!r}, expected 0.036"

def test_output_cost():
    """output_cost is $0.0525"""
    assert abs(output_cost - 0.0525) < 1e-9, f"output_cost is {output_cost!r}, expected 0.0525"

def test_total_cost():
    """total_cost is 0.0885, rounded to 4 places"""
    assert total_cost == 0.0885, f"total_cost is {total_cost!r}, expected 0.0885"

def test_inputs_unchanged():
    """The token counts and prices are unchanged"""
    assert (input_tokens, output_tokens, input_price, output_price) == (12_000, 3_500, 3.0, 15.0)
```
