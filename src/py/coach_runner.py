"""Runs a learner's code, then a challenge's tests against it, and reports the result as JSON.

The same file runs in the browser (inside Pyodide) and under CPython in
scripts/verify_content.py, so a challenge that passes verification behaves the
same way in the app.

How a run works:
  1. The learner's code is compiled as "main.py" and executed in a fresh namespace,
     with everything it prints captured.
  2. The challenge's tests are executed in a copy of that namespace, so they can
     call the learner's functions and read their variables directly. They also
     see OUTPUT, the text the learner's code printed.
  3. Every function named test_* defined in the tests is called in source order.
     Async tests are awaited. A failed assert is a "fail"; any other exception
     is an "error".
"""

import asyncio
import contextlib
import inspect
import io
import json
import linecache
import time
import traceback

USER_FILE = "main.py"
TEST_FILE = "tests.py"
ASYNC_TEST_TIMEOUT = 5.0
MAX_OUTPUT_CHARS = 20_000


class _CappedBuffer(io.StringIO):
    """A StringIO that stops growing past MAX_OUTPUT_CHARS, so a print() in a runaway loop
    can't exhaust memory before the browser's timeout stops it."""

    def __init__(self):
        super().__init__()
        self.truncated = False

    def write(self, s):
        room = MAX_OUTPUT_CHARS - self.tell()
        if room <= 0:
            self.truncated = True
            return len(s)
        if len(s) > room:
            self.truncated = True
            super().write(s[:room])
            return len(s)
        return super().write(s)

    def text(self):
        value = self.getvalue()
        return value + "\n[output truncated]\n" if self.truncated else value


def _no_input(prompt=""):
    raise RuntimeError(
        "input() isn't available here. Put the value you want in a variable instead."
    )


def _register_source(filename, source):
    # Lets tracebacks and inspect.getsource() show lines from code that was never a real file.
    linecache.cache[filename] = (len(source), None, source.splitlines(True), filename)


def _frames(exc):
    return [
        f for f in traceback.extract_tb(exc.__traceback__)
        if f.filename in (USER_FILE, TEST_FILE)
    ]


def _describe_exception(exc):
    frames = _frames(exc)
    user_frames = [f for f in frames if f.filename == USER_FILE]
    where = user_frames[-1] if user_frames else None
    return {
        "type": type(exc).__name__,
        "message": str(exc),
        "line": where.lineno if where else None,
        "source": where.line if where else None,
        "trace": [
            {"file": f.filename, "line": f.lineno, "name": f.name, "source": f.line}
            for f in frames
        ],
    }


def _describe_syntax_error(exc):
    return {
        "type": type(exc).__name__,
        "message": exc.msg,
        "line": exc.lineno,
        "col": exc.offset,
        "source": (exc.text or "").rstrip("\n"),
        "trace": [],
    }


def _label(name, fn):
    doc = inspect.getdoc(fn)
    if doc:
        return doc.splitlines()[0]
    return name.removeprefix("test_").replace("_", " ")


def _failure_message(exc):
    message = str(exc)
    if message:
        return message
    # A bare assert: show the assert statement itself.
    test_frames = [f for f in _frames(exc) if f.filename == TEST_FILE]
    if test_frames and test_frames[-1].line:
        return f"check failed: {test_frames[-1].line}"
    return "check failed"


def _collect_tests(namespace):
    tests = [
        (name, fn) for name, fn in namespace.items()
        if name.startswith("test_")
        and inspect.isfunction(fn)
        and fn.__code__.co_filename == TEST_FILE
    ]
    return sorted(tests, key=lambda item: item[1].__code__.co_firstlineno)


async def _run_test(name, fn):
    buffer = _CappedBuffer()
    started = time.perf_counter()
    entry = {"name": name, "label": _label(name, fn), "status": "pass", "message": "", "error": None}
    try:
        with contextlib.redirect_stdout(buffer):
            outcome = fn()
            if inspect.isawaitable(outcome):
                await asyncio.wait_for(outcome, ASYNC_TEST_TIMEOUT)
    except AssertionError as exc:
        entry["status"] = "fail"
        entry["message"] = _failure_message(exc)
    except (asyncio.TimeoutError, TimeoutError):
        entry["status"] = "fail"
        entry["message"] = f"timed out after {ASYNC_TEST_TIMEOUT:g}s (is something awaiting forever?)"
    except Exception as exc:  # noqa: BLE001 - every learner error is reported, not raised
        entry["status"] = "error"
        entry["error"] = _describe_exception(exc)
        entry["message"] = f"{type(exc).__name__}: {exc}"
    entry["stdout"] = buffer.text()
    entry["ms"] = round((time.perf_counter() - started) * 1000, 1)
    return entry


async def run(user_code, tests_code="", mode="test"):
    """Run user_code, then (when mode is "test") the tests. Returns a JSON string."""
    started = time.perf_counter()
    result = {"mode": mode, "stdout": "", "error": None, "tests": [], "ms": 0}

    def finish():
        result["ms"] = round((time.perf_counter() - started) * 1000, 1)
        return json.dumps(result)

    _register_source(USER_FILE, user_code)
    try:
        compiled = compile(user_code, USER_FILE, "exec")
    except SyntaxError as exc:
        result["error"] = _describe_syntax_error(exc)
        return finish()

    namespace = {"__name__": "__main__", "input": _no_input}
    buffer = _CappedBuffer()
    try:
        with contextlib.redirect_stdout(buffer):
            exec(compiled, namespace)
    except Exception as exc:  # noqa: BLE001
        result["error"] = _describe_exception(exc)
    result["stdout"] = buffer.text()

    if mode != "test" or result["error"]:
        return finish()

    _register_source(TEST_FILE, tests_code)
    test_namespace = dict(namespace)
    test_namespace["__name__"] = "coach_tests"
    test_namespace["OUTPUT"] = result["stdout"]
    exec(compile(tests_code, TEST_FILE, "exec"), test_namespace)

    for name, fn in _collect_tests(test_namespace):
        result["tests"].append(await _run_test(name, fn))
    return finish()
