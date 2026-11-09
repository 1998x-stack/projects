# 1998X / PROJECTS

### Clarity before capital. · 研究驱动的产品机会实验室

**An open, structured portfolio of AI product research and experiments.** We study real user problems, distinguish evidence from hypotheses, and make each project's stage legible to collaborators and potential investors.

[**Explore the portfolio ↗**](https://1998x-stack.github.io/projects/) · [Project index](#portfolio-index) · [Add a project](#adding-a-new-project) · [Research standards](CONTRIBUTING.md)

> **Integrity note:** This repository contains *published desk research* and *planned project placeholders*. A planned project is not presented as a completed product, customer validation or business traction. There are no implied revenue, user or investment claims.

## Portfolio index

| Domain / 分类 | Project | Stage | Deliverables |
| --- | --- | --- | --- |
| **Knowledge Intelligence / 知识智能** | [LLM × XMind](projects/knowledge/llm-xmind/) | **Published research** (2026-11-08) | [Deep dive](projects/knowledge/llm-xmind/reports/research-2026-11.md) · [MVP PRD v1.0](projects/knowledge/llm-xmind/reports/prd-mvp-v1.0.md) · [Editable PRD](projects/knowledge/llm-xmind/reports/prd-mvp-v1.0.docx) · [Technical architecture](projects/knowledge/llm-xmind/design/README.md) |
| **Code & Prototypes / 源代码与原型** | [TraceMap Code](projects/code/tracemap/) | **Development prototype** (2026-11-09; not deployed) | [Source](https://github.com/1998x-stack/TraceMap) · [Tests](https://github.com/1998x-stack/TraceMap/actions) · [Implementation gates](https://github.com/1998x-stack/TraceMap/blob/main/docs/IMPLEMENTATION_PLAN.md) |
| **Human Productivity / 个人效率** | [Beyond the To-Do List](projects/productivity/anti-procrastination-todo/) | **Working prototype + published research** (2026-11-09; unvalidated) | [Research](projects/productivity/anti-procrastination-todo/reports/research-2026-11.md) · [PRD](projects/productivity/anti-procrastination-todo/reports/prd-mvp-v1.0.md) · [Algorithm](projects/productivity/anti-procrastination-todo/reports/architecture-algorithm-v1.0.md) · [Backend](projects/productivity/anti-procrastination-todo/reports/architecture-backend-v1.0.md) · [Frontend](projects/productivity/anti-procrastination-todo/reports/architecture-frontend-v1.0.md) · [Code](https://github.com/1998x-stack/anti-procrastination-todo) |
| **Professional AI / 专业服务智能** | [Legal Intelligence](projects/professional/llm-legal-assistant/) | **Published research + PRD + architecture** (2026-11-09) · MVP not built | [Research](projects/professional/llm-legal-assistant/reports/research-2026-11.md) · [PRD](projects/professional/llm-legal-assistant/reports/prd-v1.0.md) · [MVP spec](projects/professional/llm-legal-assistant/reports/mvp-functional-spec-v1.0.md) · [Algorithm / Backend / Frontend](projects/professional/llm-legal-assistant/design/) |
| **Education & Decision Support / 教育与升学** | [LLM × 高考志愿填报](projects/education/gaokao-ai-advisor/) | **Research + proposed architecture** (2026-11-09; MVP not built) | [Research](projects/education/gaokao-ai-advisor/reports/research-2026-11.md) · [Algorithm](projects/education/gaokao-ai-advisor/design/algorithm-architecture-v1.0.md) · [Backend](projects/education/gaokao-ai-advisor/design/backend-architecture-v1.0.md) · [Frontend](projects/education/gaokao-ai-advisor/design/frontend-architecture-v1.0.md) · [API & tests](projects/education/gaokao-ai-advisor/design/README.md) |
| **Tools & Infrastructure / 基础设施** | [AI-Agent Landscape / EvidenceFlow](projects/infrastructure/ai-agent-landscape/) | **Published research + product design** (2026-11-09; MVP not built) | [Research](projects/infrastructure/ai-agent-landscape/reports/research-2026-11.md) · [PRD](projects/infrastructure/ai-agent-landscape/reports/prd-2026-11.md) · [MVP spec](projects/infrastructure/ai-agent-landscape/reports/mvp-functional-spec-2026-11.md) |

## Why the system is structured this way

We want to grow this repository without turning it into an unsearchable file dump. A single, predictable structure powers both GitHub navigation and the investor-facing [GitHub Pages website](https://1998x-stack.github.io/projects/). Each project carries a small machine-readable `project.json`; the static build uses it to generate portfolio cards, category counts, filterable discovery, individual dossier pages, downloads and a sitemap.

```text
projects/
├── knowledge/                    # Research, reasoning, information synthesis
│   └── llm-xmind/
│       ├── project.json          # Portfolio entry: status, thesis, evidence, files
│       ├── README.md             # Human-readable project entrypoint
│       ├── reports/
│           ├── research-2026-11.md
│           ├── research-2026-11.docx
│           ├── prd-mvp-v1.0.md
│           └── prd-mvp-v1.0.docx
│       └── design/
│           ├── README.md
│           ├── 01-algorithm.md
│           ├── 02-backend.md
│           ├── 03-frontend.md
│           ├── 04-contracts-testing.md
│           └── contracts/openapi.yaml
├── code/
│   └── tracemap/                  # TraceMap engineering prototype, source repo link
├── education/
│   └── gaokao-ai-advisor/         # Gaokao AI research + proposed algorithm/backend/frontend and API
├── productivity/
│   └── anti-procrastination-todo/ # Runnable code repo + research + MVP PRD
├── professional/
│   └── llm-legal-assistant/      # Research + PRD + MVP spec + technical design/
└── infrastructure/
    └── ai-agent-landscape/        # Research + EvidenceFlow PRD + MVP spec
site/                             # Public site source: HTML, CSS, JS
scripts/build.mjs                 # Zero-dependency catalog + Pages generator
templates/project/                # New-project template
.github/workflows/pages.yml      # Auto-build + deploy on main
CONTRIBUTING.md                   # Editorial and evidence standards
```

## Adding a new project

1. Pick an existing category: `knowledge`, `productivity`, `professional`, `infrastructure`, `education`, or `code`. Make `projects/<category>/<slug>/` using lowercase `kebab-case` names.
2. Copy `templates/project/project.json` and `templates/project/README.md`; update `id`, `category`, `title`, `summary`, `status`, and evidence fields. The `id` must match the folder name and be globally unique.
3. Add research/PRD files to `reports/` and technical design files to `design/`; list every public asset under `files` in `project.json`. Do **not** set `status: published` until a real dated deliverable exists; it also requires source citations.
4. Run `BASE_PATH=/ node scripts/build.mjs` locally to validate. Preview the `dist/` folder with a static HTTP server.
5. Push to `main`. The Pages workflow scans every project manifest and generates the new card, dossier and download links **automatically**. No homepage editing required.

**Technical design status:** `TraceMap` now includes a [draft engineering design](projects/knowledge/llm-xmind/design/) covering algorithm, backend, frontend, API and tests. Documentation is not implemented software.

**TraceMap implementation status:** A development-only [G0–G2 prototype](https://github.com/1998x-stack/TraceMap) is available with local unit/integration tests. It has **no production authentication, durable worker or real LLM integration**. 

**PRD / prototype status:** `TraceMap` is a proposed concept; `Start-First` has an executable, CI-tested technical prototype, not a launched or validated product. Publishing documents alone does not establish traction.

**PRD status:** `EvidenceFlow Agent` is a proposed, unimplemented product concept under AI-Agent Landscape. Published documents are not proof of PMF, technical implementation, or customer traction.

**Status vocabulary:** `planned` → `prototype` → `validating` → `launched` (or `published` for completed research). Stage language is descriptive, never a claim of funding or revenue.

## Site & deployment

The site uses **semantic HTML, CSS and vanilla JavaScript**, with no framework or runtime dependency. GitHub Actions uses Node.js 22 for the build and deploys a static artifact to Pages. Search and filters run client-side from the generated `data/catalog.json`.

```bash
# Requirements: Node.js 22+
BASE_PATH=/ node scripts/build.mjs
python3 -m http.server 4173 --directory dist
# open http://localhost:4173
```

**Pages initial setup:** Open repository **Settings → Pages → Build and deployment → Source: GitHub Actions**. The workflow is committed to this repository and deploys automatically after Pages is enabled. If the Pages source is already configured, no manual change is needed. Public site URL: `https://1998x-stack.github.io/projects/`.

## Research integrity

- **Fact:** supported by a source whose limitations are identifiable.
- **Voice of customer:** a quoted or paraphrased individual experience, never a population estimate.
- **Hypothesis:** a falsifiable inference; not validated by publishing a document.
- **Outcome:** must be measured and reproducible before claimed.

See [CONTRIBUTING.md](CONTRIBUTING.md) for source quality standards, review criteria, naming conventions and the launch checklist.

---

**1998X Projects** · Independent analysis, transparent stages, and a growing library of product opportunities. / 独立研究、清晰归档、持续验证。
