"""Check every challenge in content/ under CPython, using the same runner as the browser.

For each challenge it checks that:
  - the file parses: front matter, all five sections, at least one hint
  - the tests define at least one test_* function
  - the reference solution passes every test
  - the starter code does NOT pass every test (otherwise there is nothing to do)

Usage: python3 scripts/verify_content.py [filter]
  filter  only check challenges whose id contains this text, e.g. "basics/" or "agents/loop"
"""

import asyncio
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src" / "py"))

import coach_runner  # noqa: E402

SECTIONS = ("Lesson", "Hints", "Starter", "Solution", "Tests")
FOLDER_PATTERN = re.compile(r"^(\d+)-([a-z0-9-]+)$")
FILE_PATTERN = re.compile(r"^(\d+)-([a-z0-9-]+)\.md$")


def parse_front_matter(text, where):
    if not text.startswith("---\n"):
        raise ValueError(f"{where}: must start with a --- front matter block")
    end = text.index("\n---\n", 4)
    meta = {}
    for line in text[4:end].splitlines():
        if not line.strip():
            continue
        key, _, value = line.partition(":")
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] == '"':
            value = value[1:-1]
        meta[key.strip()] = value
    return meta, text[end + 5:]


def extract_code(body, where, section):
    lines = body.splitlines()
    fences = [i for i, line in enumerate(lines) if line.startswith("```")]
    if len(fences) < 2:
        raise ValueError(f"{where}: section {section} needs a fenced code block")
    return "\n".join(lines[fences[0] + 1:fences[-1]]) + "\n"


def parse_challenge(path):
    where = str(path.relative_to(ROOT))
    meta, rest = parse_front_matter(path.read_text(), where)
    for key in ("title", "difficulty"):
        if key not in meta:
            raise ValueError(f"{where}: front matter needs '{key}'")
    parts = re.split(r"^## (" + "|".join(SECTIONS) + r")[ \t]*$", rest, flags=re.M)
    sections = {parts[i]: parts[i + 1] for i in range(1, len(parts) - 1, 2)}
    missing = [s for s in SECTIONS if s not in sections]
    if missing:
        raise ValueError(f"{where}: missing sections {missing}")
    hints = [line[2:].strip() for line in sections["Hints"].splitlines() if line.startswith("- ")]
    if not hints:
        raise ValueError(f"{where}: needs at least one hint")
    return {
        "meta": meta,
        "hints": hints,
        "starter": extract_code(sections["Starter"], where, "Starter"),
        "solution": extract_code(sections["Solution"], where, "Solution"),
        "tests": extract_code(sections["Tests"], where, "Tests"),
    }


def challenges():
    tracks = json.loads((ROOT / "content" / "tracks.json").read_text())
    for track in tracks:
        folder = next(p for p in (ROOT / "content").iterdir()
                      if p.is_dir() and FOLDER_PATTERN.match(p.name)
                      and FOLDER_PATTERN.match(p.name).group(2) == track["id"])
        for path in sorted(folder.iterdir()):
            match = FILE_PATTERN.match(path.name)
            if match:
                yield f"{track['id']}/{match.group(2)}", path


def run(code, tests):
    return json.loads(asyncio.run(coach_runner.run(code, tests, "test")))


def summarize(result):
    if result["error"]:
        e = result["error"]
        return f"error {e['type']}: {e['message']} (line {e.get('line')})"
    return "; ".join(f"{t['status']} {t['name']}: {t['message']}" for t in result["tests"]
                     if t["status"] != "pass") or "all pass"


def main():
    only = sys.argv[1] if len(sys.argv) > 1 else ""
    problems, count = [], 0
    for challenge_id, path in challenges():
        if only not in challenge_id:
            continue
        count += 1
        try:
            challenge = parse_challenge(path)
        except ValueError as exc:
            problems.append(str(exc))
            continue
        solved = run(challenge["solution"], challenge["tests"])
        if not solved["tests"] and not solved["error"]:
            problems.append(f"{challenge_id}: tests define no test_* functions")
        elif solved["error"] or any(t["status"] != "pass" for t in solved["tests"]):
            problems.append(f"{challenge_id}: solution does not pass: {summarize(solved)}")
        started = run(challenge["starter"], challenge["tests"])
        if not started["error"] and all(t["status"] == "pass" for t in started["tests"]):
            problems.append(f"{challenge_id}: starter code already passes every test")
        print(f"  {'ok ' if not problems or not problems[-1].startswith(challenge_id) else 'BAD'} "
              f"{challenge_id}  ({len(solved['tests'])} tests)")
    print(f"\n{count} challenges checked, {len(problems)} problem(s)")
    for problem in problems:
        print(f"  - {problem}")
    sys.exit(1 if problems or count == 0 else 0)


if __name__ == "__main__":
    main()
