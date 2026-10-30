---
title: Prompt templates
difficulty: 2
concepts: str.format, KeyError, building prompts
kind: write
---

## Lesson

A prompt template is text with **placeholders** that you fill in at run time. `str.format` fills `{name}` placeholders from keyword arguments, and `**values` passes a dict's items as keyword arguments:

```python
template = "Summarize this {doc_type} in {n} bullet points."
template.format(doc_type="report", n=3)
values = {"doc_type": "email", "n": 2}
template.format(**values)
```

If a placeholder has no value, `format` raises `KeyError` with the missing name as `exc.args[0]`. That error is easy to miss in a long prompt pipeline, so convert it to a clearer one with `raise ... from exc`.

To include a literal brace, double it: `"{{not a placeholder}}"`.

Prompts for grounded answers usually wrap the reference material in clear delimiters such as XML-style tags. That way the model can tell the context apart from the instructions.

### Task

- `render(template, values)` fills the template from the dict. If a placeholder is missing, raise `ValueError("missing template variable: <name>")`.
- `build_prompt(question, docs)` returns exactly this, with the documents joined by a blank line:

```
Answer using only the context below.

<context>
first doc

second doc
</context>

Question: <question>
```

## Hints

- `try: return template.format(**values)` then `except KeyError as exc: raise ValueError(f"missing template variable: {exc.args[0]}") from exc`
- `"\n\n".join(docs)` puts a blank line between documents.
- Build `build_prompt` with one f-string. `\n` is a newline.

## Starter

```python
def render(template, values):
    return template


def build_prompt(question, docs):
    return question
```

## Solution

```python
def render(template, values):
    try:
        return template.format(**values)
    except KeyError as exc:
        raise ValueError(f"missing template variable: {exc.args[0]}") from exc


def build_prompt(question, docs):
    context = "\n\n".join(docs)
    return (
        "Answer using only the context below.\n\n"
        f"<context>\n{context}\n</context>\n\n"
        f"Question: {question}"
    )
```

## Tests

```python
def test_render():
    """render fills placeholders"""
    result = render("Summarize this {doc_type} in {n} points.", {"doc_type": "report", "n": 3})
    assert result == "Summarize this report in 3 points.", f"returned {result!r}"

def test_render_missing():
    """render raises ValueError naming the missing variable"""
    try:
        render("Hello {name}, re: {topic}", {"name": "Ada"})
    except ValueError as exc:
        assert str(exc) == "missing template variable: topic", f"message was {str(exc)!r}"
    except KeyError:
        assert False, "the KeyError should be converted to a ValueError"
    else:
        assert False, "no exception raised"

def test_build_prompt():
    """build_prompt produces the exact layout"""
    expected = ("Answer using only the context below.\n\n<context>\nParis is in France.\n\n"
                "Lyon is in France.\n</context>\n\nQuestion: Where is Lyon?")
    result = build_prompt("Where is Lyon?", ["Paris is in France.", "Lyon is in France."])
    assert result == expected, f"returned:\n{result}"
```
