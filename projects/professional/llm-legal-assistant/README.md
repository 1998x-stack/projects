# LLM × 法律助手 · Legal Intelligence

**Status:** Published desk research · **Report date:** 2026-11-08 · **Category:** Professional AI / 专业服务智能

> **Research question:** Where can LLM-powered legal assistants deliver useful, verifiable work without mistaking convenient text generation for trustworthy legal judgment?

This dossier reviews **9 Product Hunt products** and selected **Hacker News debates**. It compares customer segments, core jobs-to-be-done, product UX, strengths, limitations, first-person feedback and opposing expert viewpoints. The report cross-checks reliability concerns with **Stanford HAI** and U.S. professional ethics guidance from the **ABA**.

## Executive findings

1. **Deliver a legal task, not an impressive chat.** Drafting, clause interpretation, risk review, negotiation edits and lawyer handoff are stronger jobs than generic open-ended Q&A.
2. **User feedback has limits.** Product Hunt reviewers describe benefits such as overcoming a blank page and understanding clauses, while also noting manual cleanup, performance or coverage limits. Review counts are small and not representative.
3. **HN skepticism is substantive.** Legal research depends on credible, current sources and professional review; citations alone do not prove correct applicability or support.
4. **Narrow MVP hypothesis:** Start with New York-law mutual B2B NDA review, offer original-clause highlighting, evidence-linked risk cards, editable proposed clauses (not Track Changes) and explicit human approval. **Not yet validated PMF.**

## Product definition · PRD & MVP (2026-11-09)

**Concept status:** Specification published; **not** a shipped or validated legal AI product. The first release is scoped to English **Mutual B2B NDAs governed by New York law**, prepared and **approved by a qualified contract lawyer**. Other contract types, general legal advice, judicial outcome predictions and automatic execution are outside MVP.

| Product document | Markdown | Editable Word |
| --- | --- | --- |
| **PRD v1.0** — positioning, persona, product scope, success metrics, risk controls, pilot phases and release gates | [Read PRD](reports/prd-v1.0.md) | [Download PRD](reports/prd-v1.0.docx) |
| **MVP functional specification v1.0** — F01–F09 user stories, state machine, Given/When/Then acceptance tests, data/API contracts and red-team cases | [Read MVP spec](reports/mvp-functional-spec-v1.0.md) | [Download MVP spec](reports/mvp-functional-spec-v1.0.docx) |

**Design thesis:** upload text-native DOCX/PDF → confirm user role and scope → parse clause anchors → compare against a lawyer-approved versioned NDA playbook → show evidence-linked findings → explicit lawyer decisions → export a reviewed report and proposed clause replacements. True Word Track Changes is **post-MVP**, not a claimed capability.

## Technical architecture · 算法 / 后端 / 前端（2026-11-09）

**Architecture status:** Proposed engineering design, **not** an implemented product. All documents are aligned with F01–F09 and the bounded, lawyer-supervised New York-law mutual NDA MVP.

| Document | Contents |
| --- | --- |
| [Architecture index and cross-layer invariants](design/README.md) | Overall system, traceability matrix, ADRs and integrated release checklist |
| [Algorithm & evidence-chain architecture](design/algorithm-architecture-v1.0.md) | Precise document anchors, scope gate, curated playbook, constrained LLM proposals, citation verification, abstention and benchmark |
| [Backend & data architecture](design/backend-architecture-v1.0.md) | Modular monolith, PostgreSQL jobs/outbox, matter ACL, versioned API, immutable approvals and export consistency |
| [Frontend & review workflow architecture](design/frontend-architecture-v1.0.md) | React/TypeScript, five screens, three-panel evidence review, conflict recovery, keyboard accessibility and E2E tests |

**Trust boundary:** The model generates candidates, the server enforces evidence and authorization checks, and a qualified lawyer makes the final approval. No autonomous legal advice, automatic signing or original DOCX Track Changes is included in MVP.

## Research deliverables

| File | Description |
| --- | --- |
| [Full report (Markdown)](reports/research-2026-11.md) | All eight sections, competitor matrices, user feedback, proposed UX, validation plan and 22 source references |
| [Original formatted report (Word)](reports/research-2026-11.docx) | Eight-page editable DOCX, repackaged without changing its rendered content |

## Research coverage

**Product Hunt:** Genie AI, LegalNow, BetterLegal Assistant, Layman Law, AI Lawyer, Tome, Dottr, Referent and Vakilat.

**Hacker News themes:** Open-source legal AI, Harvey vs. DIY RAG, legal drafting without counsel, legal model hallucinations, document confidentiality, professional review and enterprise integration.

**Evidence approach:** Independently published studies and professional standards, identifiable product/user comments, public community debate and vendor claims are treated separately. The findings are **desk research**, not legal advice, a product accuracy certification, verified revenue or customer traction.

## Next validation step

Interview **8–12 SMB teams** and **5–8 contract lawyers**, assemble **50–100 redacted agreements** with lawyer-annotated risk labels, and run blinded tests measuring material-risk recall, citation support, review effort, privacy boundaries and end-to-end time. Proposed targets remain hypotheses until measured.

**Portfolio page:** [Legal Intelligence](https://1998x-stack.github.io/projects/projects/professional/llm-legal-assistant/) · [Repository index](../../../README.md) · [Publishing standards](../../../CONTRIBUTING.md)

*The original report is in Chinese. The project summary provides an English entry point for international collaborators and investors.*
