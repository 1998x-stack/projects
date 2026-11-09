# LLM × XMind

**Status:** Published research + draft MVP PRD + draft engineering architecture · **Research:** 2026-11-08 · **PRD:** 2026-11-09 · **Category:** Knowledge Intelligence

> Can LLM-powered mind mapping evolve from one-click visualization into a trustworthy workspace for research and decisions?

This project studies the product landscape and original discussions on **Hacker News** and **Product Hunt**, supported by vendor documentation. The report distinguishes verified features, individual user opinions and untested product hypotheses.

## Key findings

- The Xmind 2027 release shifts toward Agent-assisted, ongoing modification of maps and MCP connections.
- Users appreciate time savings and polished visuals, but ask for provenance, editing control, integrations and clear privacy boundaries.
- A promising *hypothesis* is an evidence-first research canvas with claim-level citations, local edits and version history. Product-market fit is **not** proven.

## MVP product concept: TraceMap (working name)

**Positioning:** An evidence-first, human-controlled AI research map for product research and decision support. The proposed MVP includes document import, source-anchored claims, editable tree views, review-before-apply AI patches, recovery, and Xmind-compatible Markdown handoff. This is a **draft specification**, not an implemented product or validated business.

**MVP priority:** seven P0 epics / 34 individually testable requirements. The success gates, data contract and safety constraints are documented in the PRD.

## Research & product specification files

| File | Purpose |
| --- | --- |
| [Full research (Markdown)](reports/research-2026-11.md) | Source of truth; links to original discussions and official docs |
| [Editable Word report](reports/research-2026-11.docx) | Formatted document for sharing and annotation |
| [MVP PRD v1.0 (Markdown)](reports/prd-mvp-v1.0.md) | Product goals, 7 P0 epics / 34 acceptance-testable requirements, data model, APIs, evaluation |
| [MVP PRD v1.0 (Word)](reports/prd-mvp-v1.0.docx) | Formatted editable requirement specification for product, design and engineering review |
| [Technical design overview](design/README.md) | Architecture decisions, shared invariants, implementation order |
| [01 · Algorithm / AI pipeline](design/01-algorithm.md) | Ingestion, exact evidence anchoring, generation, scoped patch, quality evaluation |
| [02 · Backend architecture](design/02-backend.md) | FastAPI, PostgreSQL, durable jobs, atomic changes, security and privacy |
| [03 · Frontend architecture](design/03-frontend.md) | React Flow, inspector, AI Diff UI, state, recovery, accessibility |
| [04 · API & test matrix](design/04-contracts-testing.md) | HTTP examples, errors, acceptance mapping for all 34 P0 requirements |
| [OpenAPI 3.1 contract](design/contracts/openapi.yaml) | Draft machine-readable FE/BE integration contract |

## Engineering status / 技术阶段

These documents are **design specifications only (尚未开发)**. The existing GitHub Pages portfolio is a static showcase, not the TraceMap product. No live FastAPI backend, React application, algorithm-quality results or user validation is claimed.

## Evidence scope

21 cited source entries across HN, PH, official docs and open source. Desk research only; no independently measured retention, revenue, model quality or user outcomes.

**Website:** [Project profile](https://1998x-stack.github.io/projects/projects/knowledge/llm-xmind/)
