---
title: An eval report
difficulty: 3
concepts: aggregation, grouping by tag, reporting
kind: build
---

## Lesson

A single pass rate hides a lot. Real eval suites **tag** cases by category, such as billing, refunds or adversarial prompts, and report each tag separately. That's how you notice that a prompt change improved refunds but broke billing.

A report also lists the **failing case ids**, so you can go straight to them.

```python
{
    "total": 5, "passed": 3, "pass_rate": 0.6,
    "by_tag": {"billing": {"total": 2, "passed": 2, "pass_rate": 1.0},
               "refunds": {"total": 3, "passed": 1, "pass_rate": 0.333}},
    "failures": ["r2", "r3"],
}
```

Cases can have several tags, and they count towards each one. A grader that raises is a failure of that case. It must not crash the whole report.

### Task

Write `run_eval(cases, predict, grader)`:

- Each case is `{"id", "input", "expected", "tags": [...]}`.
- A case passes if `grader(predict(case["input"]), case["expected"])` returns `True`. If `predict` or `grader` raises, the case fails.
- Return the report above. Round `pass_rate` values to 3 places, keep `failures` in case order, and use `0.0` as the pass rate when there are no cases.

## Hints

- Write a small helper `rate(passed, total)` that handles a total of zero.
- `stats = by_tag.setdefault(tag, {"total": 0, "passed": 0})` creates a tag's counters the first time you see it.
- Add each `pass_rate` after the loop.

## Starter

```python
def run_eval(cases, predict, grader):
    passed = sum(1 for c in cases if grader(predict(c["input"]), c["expected"]))
    return {"total": len(cases), "passed": passed}
```

## Solution

```python
def rate(passed, total):
    return round(passed / total, 3) if total else 0.0


def run_eval(cases, predict, grader):
    by_tag = {}
    failures = []
    passed = 0
    for case in cases:
        try:
            ok = bool(grader(predict(case["input"]), case["expected"]))
        except Exception:
            ok = False
        if ok:
            passed += 1
        else:
            failures.append(case["id"])
        for tag in case.get("tags", []):
            stats = by_tag.setdefault(tag, {"total": 0, "passed": 0})
            stats["total"] += 1
            stats["passed"] += ok
    for stats in by_tag.values():
        stats["pass_rate"] = rate(stats["passed"], stats["total"])
    return {"total": len(cases), "passed": passed, "pass_rate": rate(passed, len(cases)),
            "by_tag": by_tag, "failures": failures}
```

## Tests

```python
CASES = [
    {"id": "b1", "input": "invoice", "expected": "billing", "tags": ["billing"]},
    {"id": "b2", "input": "charge", "expected": "billing", "tags": ["billing", "hard"]},
    {"id": "r1", "input": "refund", "expected": "refunds", "tags": ["refunds"]},
    {"id": "r2", "input": "money back", "expected": "refunds", "tags": ["refunds", "hard"]},
    {"id": "r3", "input": "boom", "expected": "refunds", "tags": ["refunds"]},
]
LABELS = {"invoice": "billing", "charge": "billing", "refund": "refunds", "money back": "billing"}

def predict(text):
    return LABELS[text]          # KeyError for "boom"

def exact(output, expected):
    return output == expected

def test_totals():
    """Totals and the overall pass rate"""
    r = run_eval(CASES, predict, exact)
    assert (r["total"], r["passed"], r["pass_rate"]) == (5, 3, 0.6), f"got {r.get('total')}, {r.get('passed')}, {r.get('pass_rate')}"

def test_by_tag():
    """Per-tag stats, counting multi-tagged cases in each tag"""
    r = run_eval(CASES, predict, exact)
    assert r["by_tag"] == {
        "billing": {"total": 2, "passed": 2, "pass_rate": 1.0},
        "hard": {"total": 2, "passed": 1, "pass_rate": 0.5},
        "refunds": {"total": 3, "passed": 1, "pass_rate": 0.333},
    }, f"by_tag: {r.get('by_tag')!r}"

def test_failures():
    """Failures are listed in order, including crashed cases"""
    assert run_eval(CASES, predict, exact)["failures"] == ["r2", "r3"]

def test_empty():
    """An empty suite"""
    assert run_eval([], predict, exact) == {"total": 0, "passed": 0, "pass_rate": 0.0, "by_tag": {}, "failures": []}
```
