# TraceMap Code / 工程实现

**Status: development prototype only (本地开发原型，尚未正式上线).**

TraceMap is the engineering implementation of the [LLM × XMind research and PRD](../../knowledge/llm-xmind/). It is deliberately separated from the research repository:

- **Research & PRD:** [1998X Projects / LLM × XMind](../../knowledge/llm-xmind/)
- **Source code:** https://github.com/1998x-stack/TraceMap
- **CI / reproducible checks:** https://github.com/1998x-stack/TraceMap/actions
- **Implementation plan:** https://github.com/1998x-stack/TraceMap/blob/main/docs/IMPLEMENTATION_PLAN.md

## Engineering categories

```text
TraceMap/
├── apps/api/          # FastAPI + development persistence + invariant tests
├── apps/web/          # React Flow research workspace
├── packages/contracts # API contract alignment (in progress)
├── infra/             # Production infrastructure placeholders
├── docs/              # Architecture decisions and stage gates
└── .github/workflows/ # CI
```

## What is available

The first foundation includes project/source operations, Unicode evidence anchors, editable trees, revision control, read-only draft/patch proposals requiring confirmation, undo, and Markdown/JSON export. It uses **demo extractive/rule logic instead of a real LLM**. Production login, safe isolated PDF processing, PostgreSQL/worker migrations, real model evaluations and Xmind import tests remain future work.

No revenue, users, accuracy, performance, or safety certification is claimed.

> **Important:** The GitHub Pages site is a public portfolio. It is **not** a hosted or authenticated TraceMap product.
