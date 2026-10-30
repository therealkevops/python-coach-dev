---
title: Dataclasses
difficulty: 2
concepts: dataclass, fields, methods, classmethod
kind: write
---

## Lesson

A **class** defines a new type of object. A **dataclass** is the quickest way to write one that mainly holds data: you list the fields with type hints, and Python generates `__init__`, a readable `repr`, and `==`.

```python
from dataclasses import dataclass

@dataclass
class Message:
    role: str
    content: str

m = Message("user", "Hi")      # or Message(role="user", content="Hi")
m.role                         # "user"   attribute access with a dot
m == Message("user", "Hi")     # True
```

A **method** is a function defined inside the class. Its first parameter, `self`, is the object it was called on:

```python
    def shout(self):
        return self.content.upper()
```

A `@classmethod` receives the class itself (`cls`) instead of an object. It's the usual way to write an alternative constructor, such as building an object from a dict.

### Task

Write a dataclass `Message` with fields `role: str` and `content: str`, and:

- a method `to_dict(self)` that returns `{"role": ..., "content": ...}`
- a classmethod `from_dict(cls, data)` that builds a `Message` from such a dict
- a method `is_user(self)` that returns `True` if the role is `"user"`

## Hints

- Put `@dataclass` on the line above `class Message:`.
- `return {"role": self.role, "content": self.content}`
- `@classmethod` above `def from_dict(cls, data):`, which returns `cls(data["role"], data["content"])`.

## Starter

```python
from dataclasses import dataclass


class Message:
    pass
```

## Solution

```python
from dataclasses import dataclass


@dataclass
class Message:
    role: str
    content: str

    def to_dict(self):
        return {"role": self.role, "content": self.content}

    @classmethod
    def from_dict(cls, data):
        return cls(data["role"], data["content"])

    def is_user(self):
        return self.role == "user"
```

## Tests

```python
def test_fields():
    """Message has role and content"""
    m = Message("user", "Hi")
    assert m.role == "user" and m.content == "Hi"

def test_keyword_construction_and_equality():
    """Keyword construction and == work"""
    assert Message(role="assistant", content="Hello") == Message("assistant", "Hello")

def test_to_dict():
    """to_dict returns a role/content dict"""
    assert Message("user", "Hi").to_dict() == {"role": "user", "content": "Hi"}

def test_from_dict():
    """from_dict builds a Message"""
    m = Message.from_dict({"role": "assistant", "content": "Yo"})
    assert isinstance(m, Message), f"from_dict returned {type(m).__name__}"
    assert m == Message("assistant", "Yo")

def test_is_user():
    """is_user checks the role"""
    assert Message("user", "x").is_user() is True
    assert Message("assistant", "x").is_user() is False
```
