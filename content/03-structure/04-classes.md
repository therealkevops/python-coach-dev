---
title: Classes that hold state
difficulty: 2
concepts: class, __init__, self, default_factory, __len__
kind: write
---

## Lesson

Some objects hold state that changes over time. A conversation grows as messages are added. A dataclass field with a list as its default needs `field(default_factory=list)`, for the same reason as the mutable-default trap: each object must get its *own* list.

```python
from dataclasses import dataclass, field

@dataclass
class Inbox:
    owner: str
    items: list = field(default_factory=list)

    def add(self, item):
        self.items.append(item)
```

Special methods with double underscores ("dunder" methods) hook into Python's syntax. Define `__len__` and `len(obj)` works on your object.

A class like this one wraps the raw list of message dicts that the API expects. The rest of your code calls simple methods, and the class keeps the format right.

### Task

Write a dataclass `Conversation` with:

- a field `system: str = ""` and a field `messages` that defaults to a new empty list
- `add_user(text)` and `add_assistant(text)`, each appending a `{"role": ..., "content": text}` dict
- `to_api()` returning `{"system": ..., "messages": [...]}`, with a *copy* of the messages list
- `__len__` returning the number of messages

## Hints

- `messages: list = field(default_factory=list)`
- `self.messages.append({"role": "user", "content": text})`
- `list(self.messages)` makes a copy.

## Starter

```python
from dataclasses import dataclass, field


@dataclass
class Conversation:
    system: str = ""
    messages = []

    def add_user(self, text):
        self.messages.append(text)
```

## Solution

```python
from dataclasses import dataclass, field


@dataclass
class Conversation:
    system: str = ""
    messages: list = field(default_factory=list)

    def add_user(self, text):
        self.messages.append({"role": "user", "content": text})

    def add_assistant(self, text):
        self.messages.append({"role": "assistant", "content": text})

    def to_api(self):
        return {"system": self.system, "messages": list(self.messages)}

    def __len__(self):
        return len(self.messages)
```

## Tests

```python
def test_add_messages():
    """add_user and add_assistant append message dicts"""
    c = Conversation(system="Be brief.")
    c.add_user("Hi")
    c.add_assistant("Hello")
    assert c.messages == [{"role": "user", "content": "Hi"}, {"role": "assistant", "content": "Hello"}], f"messages is {c.messages!r}"

def test_len():
    """len() counts messages"""
    c = Conversation()
    c.add_user("a")
    c.add_assistant("b")
    c.add_user("c")
    assert len(c) == 3

def test_separate_lists():
    """Each Conversation has its own list"""
    a, b = Conversation(), Conversation()
    a.add_user("only in a")
    assert len(b.messages) == 0, "b sees a's message: the list is shared"

def test_to_api():
    """to_api returns system and a copy of messages"""
    c = Conversation(system="S")
    c.add_user("x")
    api = c.to_api()
    assert api == {"system": "S", "messages": [{"role": "user", "content": "x"}]}
    api["messages"].append({"role": "assistant", "content": "y"})
    assert len(c) == 1, "changing the returned list must not change the conversation"
```
