---
title: Rubric graders
difficulty: 2
concepts: graders, rubrics, collecting failures
kind: write
---

## Lesson

Most AI outputs are open-ended text, with no single correct string. A **rubric grader** checks properties of the answer instead:

- **must include**: key facts that have to be there
- **must not include**: forbidden content, such as a competitor's name, "As an AI", or private data
- **length**: summaries that ramble are failures

Report *why* an output failed, not only that it failed. A list of failure reasons makes regressions easy to diagnose:

```python
{"passed": False, "failures": ["missing: refund window", "too long: 212 words > 150"]}
```

Use case-insensitive matching for phrases: compare `phrase.lower() in output.lower()`.

### Task

Write `grade(output, rubric)`. The rubric has optional keys `must_include` (a list of phrases), `must_not_include` (a list) and `max_words` (an int). Return `{"passed": bool, "failures": [...]}`, with failures in this order and format:

- `"missing: <phrase>"` for each required phrase that's absent, in rubric order
- `"forbidden: <phrase>"` for each forbidden phrase that's present
- `"too long: <n> words > <max>"`

## Hints

- `low = output.lower()`, then `if phrase.lower() not in low: failures.append(f"missing: {phrase}")`.
- `words = len(output.split())`
- `"passed": not failures`

## Starter

```python
def grade(output, rubric):
    return {"passed": True, "failures": []}
```

## Solution

```python
def grade(output, rubric):
    low = output.lower()
    failures = []
    for phrase in rubric.get("must_include", []):
        if phrase.lower() not in low:
            failures.append(f"missing: {phrase}")
    for phrase in rubric.get("must_not_include", []):
        if phrase.lower() in low:
            failures.append(f"forbidden: {phrase}")
    limit = rubric.get("max_words")
    words = len(output.split())
    if limit is not None and words > limit:
        failures.append(f"too long: {words} words > {limit}")
    return {"passed": not failures, "failures": failures}
```

## Tests

```python
RUBRIC = {"must_include": ["30 days", "receipt"], "must_not_include": ["as an AI"], "max_words": 20}

def test_pass():
    """A good answer passes"""
    out = "You can return items within 30 days if you have your Receipt."
    assert grade(out, RUBRIC) == {"passed": True, "failures": []}

def test_missing():
    """Missing phrases are reported in order"""
    result = grade("Returns are accepted.", RUBRIC)
    assert result == {"passed": False, "failures": ["missing: 30 days", "missing: receipt"]}, f"returned {result!r}"

def test_forbidden_case_insensitive():
    """Forbidden phrases are matched case-insensitively"""
    result = grade("As an AI, I think 30 days with a receipt.", RUBRIC)
    assert result["failures"] == ["forbidden: as an AI"], f"returned {result!r}"

def test_too_long():
    """Length limits are enforced"""
    out = "30 days receipt " + "word " * 30
    result = grade(out, RUBRIC)
    assert result["failures"] == ["too long: 33 words > 20"], f"returned {result!r}"

def test_empty_rubric():
    """An empty rubric passes everything"""
    assert grade("anything", {})["passed"] is True
```
