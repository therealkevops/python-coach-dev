# pycoach

A browser-based dojo for learning Python for AI and agentic applications. It starts at `print()` and ends with a tool-using agent, guardrails and an eval harness. Each challenge is a short lesson plus code you write, checked by tests. Python runs in the browser through [Pyodide](https://pyodide.org), so there is no server and nothing you type leaves the page.

## What's in it

| Track | Challenges | Covers |
|---|---|---|
| 1 Python basics | 14 | print, variables, numbers, strings, functions, if/elif, lists, loops, dicts, errors, comprehensions |
| 2 Data and text | 8 | JSON, nested API responses, extracting JSON from model output, prompt templates, chunking, cosine similarity, ranking, context budgets |
| 3 Functions, classes and types | 10 | default/keyword args, type hints, dataclasses, classes, decorators, a tool registry, Pydantic validation, structured output, tool schemas from signatures |
| 4 Async and reliability | 6 | async/await, `gather`, timeouts, retries with backoff, semaphores, generators and streaming |
| 5 Tool use | 4 | tool definitions, reading `tool_use` blocks, running tools safely, a full round trip |
| 6 Agent loops | 5 | the agent loop, traces, guardrails, context trimming, a capstone `Agent` class |
| 7 Evaluation | 4 | exact match, rubric graders, LLM-as-judge, eval reports |

Model calls use **mockllm**, a scripted stand-in with the shapes of the Anthropic Messages API, so the agent challenges are deterministic and need no API key. Like the real API, it rejects malformed conversations, such as a `tool_use` with no matching `tool_result`. See [docs/mockllm.md](docs/mockllm.md).

**The learning loop:**

- Run (Ctrl+') shows what your code prints. Check (Ctrl+Enter) runs the tests.
- Failures show the test's message, the line in your code, and a plain-language explanation of the error.
- Hints are revealed one at a time and cost XP. Revealing the solution earns none.
- Every pass schedules a spaced review (1, 3, 7, 14, 30, 60 days). In a review you solve the challenge again from the starter code.
- Progress lives in `localStorage`. Settings can export it to a file and import it again.

## Development

```bash
npm install
npm run dev            # http://localhost:8998
npm run lint
npm test               # unit tests: content format, progress and review scheduling
npm run test:content   # every solution passes and every starter fails, under CPython 3.13 (needs pydantic)
npm run test:ui        # production build in headless Chromium: every solution in Pyodide, the editor, timeouts
```

The UI tests download Pyodide from jsDelivr, so they need network access.

## Layout

```
content/              the curriculum: tracks.json and one Markdown file per challenge
docs/authoring.md     the challenge format and how tests run
docs/mockllm.md       mockllm API (also shown on the in-app Reference page)
src/py/               coach_runner.py (runs code + tests) and mockllm.py, loaded into Pyodide
src/runtime/          the Pyodide Web Worker and the page-side client (timeouts, restarts)
src/content/          parses content/ at build time
src/state/            progress store (localStorage) and pure scoring/review logic
src/components/       React UI
scripts/verify_content.py   checks every challenge under CPython with the same runner
```

## Deployment

The app is a static Vite build. `vercel.json` configures Vercel: framework `vite`, output `dist`. Import the repository in Vercel and deploy. No environment variables are needed. Pyodide (about 10 MB) is fetched from jsDelivr on first use and cached by the browser.
