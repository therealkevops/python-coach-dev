---
title: Writing a tool definition
difficulty: 2
concepts: tool definitions, JSON Schema, enum, required
kind: write
---

## Lesson

**Tool use** (also called function calling) lets a model ask *your code* to do something it can't do itself: look up data, run a calculation, call an API. You describe each tool, and the model decides when to call it and with what arguments.

A tool definition has three parts:

```python
{
    "name": "get_stock_price",                       # letters, digits, _ and -
    "description": "Get the latest price for a stock ticker, e.g. AAPL. "
                   "Use this whenever the user asks about a current price.",
    "input_schema": {                                # a JSON Schema object
        "type": "object",
        "properties": {
            "ticker": {"type": "string", "description": "Ticker symbol, uppercase"},
        },
        "required": ["ticker"],
    },
}
```

The model only sees the name, the description and the schema, so **the description is a prompt**. Say what the tool does, when to use it, and what the arguments mean. `"enum": [...]` limits a string to fixed values. Optional parameters go in `properties` but not in `required`.

### Task

Define `WEATHER_TOOL` for a tool named `get_weather`:

- a description of at least 20 characters that mentions "weather"
- a required string parameter `city`, with a description
- an optional string parameter `unit`, limited to `"celsius"` or `"fahrenheit"`

## Hints

- Copy the example's structure and change the names.
- `"unit": {"type": "string", "enum": ["celsius", "fahrenheit"]}`
- `"required": ["city"]`. Leaving `unit` out makes it optional.

## Starter

```python
WEATHER_TOOL = {
    "name": "get_weather",
    "input_schema": {},
}
```

## Solution

```python
WEATHER_TOOL = {
    "name": "get_weather",
    "description": "Get the current weather for a city. Use this when the user asks about weather conditions.",
    "input_schema": {
        "type": "object",
        "properties": {
            "city": {"type": "string", "description": "City name, e.g. 'Paris'"},
            "unit": {"type": "string", "enum": ["celsius", "fahrenheit"], "description": "Temperature unit"},
        },
        "required": ["city"],
    },
}
```

## Tests

```python
def test_name_and_description():
    """The tool has a name and a useful description"""
    assert WEATHER_TOOL.get("name") == "get_weather"
    desc = WEATHER_TOOL.get("description", "")
    assert len(desc) >= 20 and "weather" in desc.lower(), f"description is {desc!r}"

def test_schema_shape():
    """input_schema is an object schema"""
    schema = WEATHER_TOOL.get("input_schema", {})
    assert schema.get("type") == "object", "input_schema needs \"type\": \"object\""
    assert isinstance(schema.get("properties"), dict), "input_schema needs a properties dict"

def test_city():
    """city is a required string with a description"""
    schema = WEATHER_TOOL["input_schema"]
    city = schema["properties"].get("city", {})
    assert city.get("type") == "string", f"city is {city!r}"
    assert city.get("description"), "give city a description"
    assert schema.get("required") == ["city"], f"required is {schema.get('required')!r}"

def test_unit():
    """unit is an optional enum"""
    unit = WEATHER_TOOL["input_schema"]["properties"].get("unit", {})
    assert unit.get("type") == "string"
    assert sorted(unit.get("enum", [])) == ["celsius", "fahrenheit"], f"unit is {unit!r}"
```
