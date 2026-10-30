---
title: LLM as judge
difficulty: 3
concepts: regex, parsing judge output, retries on bad format
kind: write
---

## Lesson

Some qualities, such as helpfulness, tone or faithfulness to a source, are hard to check with rules. An **LLM judge** is a model prompted to grade another model's output against criteria. Judges work best with a narrow question and a fixed output format, such as `SCORE: 1-5`.

Judges sometimes ignore the format, so parse defensively. A **regular expression** finds a pattern in text:

```python
import re
m = re.search(r"SCORE:\s*([1-5])", "Reasoning... SCORE: 4")
m.group(1)      # "4"     the part in parentheses
re.search(r"x", "abc")   # None when nothing matches
```

`\s*` matches any amount of whitespace and `[1-5]` matches one digit from 1 to 5. Add `re.IGNORECASE` as a third argument to ignore case.

If the judge's reply can't be parsed, ask **once more**, then give up and return `None`. Retrying forever just costs money.

### Task

- `parse_score(text)` returns the integer after `SCORE:` (1 to 5, any case), or `None`.
- `judge(llm, question, answer)` calls `llm.create` with one user message. That message is exactly `JUDGE_PROMPT` filled in with the question and answer. Return the parsed score. If the reply can't be parsed, retry once with the same message, then return `None`.

## Hints

- `re.search(r"score:\s*([1-5])", text, re.IGNORECASE)`
- `JUDGE_PROMPT.format(question=question, answer=answer)`
- `for _ in range(2):` call, parse, and return the score if it isn't `None`.

## Starter

```python
import re

JUDGE_PROMPT = (
    "Rate how well the answer addresses the question, from 1 (useless) to 5 (excellent).\n"
    "Question: {question}\nAnswer: {answer}\n"
    "Explain briefly, then end with SCORE: <1-5>."
)


def parse_score(text):
    return int(text[-1])


def judge(llm, question, answer):
    return None
```

## Solution

```python
import re

JUDGE_PROMPT = (
    "Rate how well the answer addresses the question, from 1 (useless) to 5 (excellent).\n"
    "Question: {question}\nAnswer: {answer}\n"
    "Explain briefly, then end with SCORE: <1-5>."
)


def parse_score(text):
    m = re.search(r"score:\s*([1-5])", text, re.IGNORECASE)
    return int(m.group(1)) if m else None


def judge(llm, question, answer):
    prompt = JUDGE_PROMPT.format(question=question, answer=answer)
    for _ in range(2):
        response = llm.create(messages=[{"role": "user", "content": prompt}])
        reply = "".join(b["text"] for b in response["content"] if b["type"] == "text")
        score = parse_score(reply)
        if score is not None:
            return score
    return None
```

## Tests

```python
from mockllm import MockLLM

def test_parse_score():
    """parse_score finds the score"""
    assert parse_score("Clear and correct. SCORE: 5") == 5
    assert parse_score("score:3") == 3
    assert parse_score("Score:   2 (weak)") == 2

def test_parse_score_invalid():
    """Missing or out-of-range scores give None"""
    assert parse_score("I'd say about four out of five.") is None
    assert parse_score("SCORE: 9") is None

def test_judge_prompt():
    """judge sends the filled-in prompt"""
    llm = MockLLM(["Good. SCORE: 4"])
    assert judge(llm, "What is 2+2?", "4") == 4
    sent = llm.calls[0]["messages"]
    assert sent == [{"role": "user", "content": JUDGE_PROMPT.format(question="What is 2+2?", answer="4")}], f"sent {sent!r}"

def test_judge_retries_once():
    """An unparseable reply is retried once"""
    llm = MockLLM(["Pretty good!", "SCORE: 3"])
    assert judge(llm, "q", "a") == 3
    assert llm.call_count == 2

def test_judge_gives_up():
    """judge gives up after two bad replies"""
    llm = MockLLM(["Nice.", "Very nice.", "SCORE: 5"])
    assert judge(llm, "q", "a") is None
    assert llm.call_count == 2, f"made {llm.call_count} calls; retry only once"
```
