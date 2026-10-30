"""A scripted stand-in for an LLM API, for practising tool use and agent loops offline.

It follows the shape of the Anthropic Messages API, using plain dicts. A request:

    llm.create(messages=[{"role": "user", "content": "Hi"}], tools=[...], system="...")

returns a response like:

    {"role": "assistant",
     "stop_reason": "end_turn",            # or "tool_use", "max_tokens"
     "content": [{"type": "text", "text": "Hello!"},
                 {"type": "tool_use", "id": "toolu_1", "name": "search", "input": {"q": "x"}}],
     "usage": {"input_tokens": 12, "output_tokens": 3}}

Instead of a real model, MockLLM replays the responses you give it, in order. Each
scripted response is a string (a plain text reply), a dict built with text() or
tool_call(), or a function that receives (messages, tools) and returns one of those.

Like the real API, create() checks the messages you send and raises APIError if the
conversation is malformed: roles must alternate starting with "user", and every
tool_use block must be answered by a tool_result block in the next user message.
"""

import asyncio
import copy
import itertools
import json

__all__ = [
    "APIError", "RateLimitError", "OverloadedError",
    "MockLLM", "text", "tool_call", "tool_calls", "estimate_tokens", "validate_messages",
]


class APIError(Exception):
    """The request was rejected. Retrying the same request won't help."""


class RateLimitError(APIError):
    """Too many requests. Waiting and retrying usually works."""


class OverloadedError(APIError):
    """The service is busy. Waiting and retrying usually works."""


_tool_ids = itertools.count(1)


def text(reply, stop_reason="end_turn"):
    """A response containing a single text block."""
    return {"role": "assistant", "stop_reason": stop_reason,
            "content": [{"type": "text", "text": reply}]}


def tool_call(name, input=None, *, id=None, text=None):
    """A response asking for one tool call, optionally with some text before it."""
    return tool_calls((name, input or {}), id=id, text=text)


def tool_calls(*calls, id=None, text=None):
    """A response asking for several tool calls at once. Each call is a (name, input) pair."""
    content = [{"type": "text", "text": text}] if text else []
    for index, (name, input) in enumerate(calls):
        if id is None:
            call_id = f"toolu_{next(_tool_ids)}"
        else:
            call_id = id if len(calls) == 1 else f"{id}_{index + 1}"
        content.append({"type": "tool_use", "id": call_id, "name": name, "input": dict(input)})
    return {"role": "assistant", "stop_reason": "tool_use", "content": content}


def estimate_tokens(value):
    """A rough token count: about four characters per token."""
    if not isinstance(value, str):
        value = json.dumps(value)
    return max(1, len(value) // 4)


def _blocks(message):
    content = message.get("content")
    return content if isinstance(content, list) else []


def validate_messages(messages):
    """Raise APIError if `messages` is not a conversation the Messages API would accept."""
    if not isinstance(messages, list) or not messages:
        raise APIError("messages must be a non-empty list")
    for index, message in enumerate(messages):
        if not isinstance(message, dict):
            raise APIError(f"messages[{index}] must be a dict, got {type(message).__name__}")
        role = message.get("role")
        if role not in ("user", "assistant"):
            raise APIError(f"messages[{index}] has role {role!r}; use 'user' or 'assistant' "
                           "(the system prompt goes in the system= argument)")
        if not isinstance(message.get("content"), (str, list)):
            raise APIError(f"messages[{index}] needs 'content' as a string or a list of blocks")
        expected = "user" if index % 2 == 0 else "assistant"
        if role != expected:
            raise APIError(f"messages[{index}] should have role {expected!r}: roles must "
                           "alternate user, assistant, user, ... starting with 'user'")
    for index, message in enumerate(messages):
        if message["role"] != "assistant":
            continue
        wanted = {b.get("id") for b in _blocks(message) if b.get("type") == "tool_use"}
        if not wanted or index + 1 >= len(messages):
            continue
        answered = {b.get("tool_use_id") for b in _blocks(messages[index + 1])
                    if b.get("type") == "tool_result"}
        missing = wanted - answered
        if missing:
            raise APIError(f"messages[{index + 1}] must contain a tool_result for every tool_use "
                           f"in messages[{index}]; missing: {sorted(missing)}")
    for index, message in enumerate(messages):
        results = [b for b in _blocks(message) if b.get("type") == "tool_result"]
        if not results:
            continue
        previous = messages[index - 1] if index > 0 else {}
        asked = {b.get("id") for b in _blocks(previous) if b.get("type") == "tool_use"}
        for block in results:
            if block.get("tool_use_id") not in asked:
                raise APIError(f"messages[{index}] has a tool_result for "
                               f"{block.get('tool_use_id')!r}, which the previous assistant "
                               "message didn't ask for")


class MockLLM:
    """A fake model that replays scripted responses.

    MockLLM(responses, fail_times=0, error=RateLimitError, latency=0.0)

      responses   the replies, in the order they will be returned
      fail_times  raise `error` on this many calls before replying normally
      latency     seconds acreate() waits before replying

    After use, inspect what your code sent:
      llm.calls          one dict per request: messages, tools, system, max_tokens, model
      llm.call_count     the number of requests made
      llm.max_in_flight  the most acreate() calls that were running at once
    """

    def __init__(self, responses=(), *, fail_times=0, error=RateLimitError, latency=0.0):
        self.responses = list(responses)
        self.calls = []
        self.fail_times = fail_times
        self.error = error
        self.latency = latency
        self.in_flight = 0
        self.max_in_flight = 0

    @property
    def call_count(self):
        return len(self.calls)

    def create(self, *, messages, tools=None, system=None, max_tokens=1024, model="mock-1"):
        self.calls.append({
            "messages": copy.deepcopy(messages), "tools": copy.deepcopy(tools),
            "system": system, "max_tokens": max_tokens, "model": model,
        })
        if self.fail_times > 0:
            self.fail_times -= 1
            raise self.error(f"{self.error.__name__} (scripted failure)")
        validate_messages(messages)
        if not self.responses:
            raise APIError("MockLLM ran out of scripted responses: your code called the "
                           f"model {self.call_count} times, more than the script expected")
        reply = self.responses.pop(0)
        if callable(reply):
            reply = reply(copy.deepcopy(messages), copy.deepcopy(tools))
        if isinstance(reply, str):
            reply = text(reply)
        reply = copy.deepcopy(reply)
        reply.setdefault("usage", {
            "input_tokens": estimate_tokens(messages) + (estimate_tokens(system) if system else 0),
            "output_tokens": estimate_tokens(reply["content"]),
        })
        return reply

    async def acreate(self, **kwargs):
        self.in_flight += 1
        self.max_in_flight = max(self.max_in_flight, self.in_flight)
        try:
            await asyncio.sleep(self.latency)
            return self.create(**kwargs)
        finally:
            self.in_flight -= 1
