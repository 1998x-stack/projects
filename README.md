# 1998X / PROJECTS

### Clarity before capital. · 研究驱动的产品机会实验室

**An open, structured portfolio of AI product research and experiments.** We study real user problems, distinguish evidence from hypotheses, and make each project's stage legible to collaborators and potential investors.

[**Explore the portfolio ↗**](https://1998x-stack.github.io/projects/) · [Project index](#portfolio-index) · [Add a project](#adding-a-new-project) · [Research standards](CONTRIBUTING.md)

> **Integrity note:** This repository contains *published desk research* and *planned project placeholders*. A planned project is not presented as a completed product, customer validation or business traction. There are no implied revenue, user or investment claims.

## Portfolio index

| Domain / 分类 | Project | Stage | Deliverables |
| --- | --- | --- | --- |
| **Knowledge Intelligence / 知识智能** | [LLM × XMind](projects/knowledge/llm-xmind/) | **Published research** (2026-11-08) | [Deep dive (MD)](projects/knowledge/llm-xmind/reports/research-2026-11.md) · [Word](projects/knowledge/llm-xmind/reports/research-2026-11.docx) |
| **Human Productivity / 个人效率** | [Beyond the To-Do List](projects/productivity/anti-procrastination-todo/) | **Published research** (2026-11-08) | [Deep dive (MD)](projects/productivity/anti-procrastination-todo/reports/research-2026-11.md) · [Word](projects/productivity/anti-procrastination-todo/reports/research-2026-11.docx) |
| **Professional AI / 专业服务智能** | [Legal Intelligence](projects/professional/llm-legal-assistant/) | **Published research** (2026-11-08) | [Deep dive (MD)](projects/professional/llm-legal-assistant/reports/research-2026-11.md) · [Word](projects/professional/llm-legal-assistant/reports/research-2026-11.docx) |
| **Tools & Infrastructure / 基础设施** | [AI-Agent Landscape](projects/infrastructure/ai-agent-landscape/) | **Published research** (2026-11-09) | [Deep dive (MD)](projects/infrastructure/ai-agent-landscape/reports/research-2026-11.md) |

## Why the system is structured this way

We want to grow this repository without turning it into an unsearchable file dump. A single, predictable structure powers both GitHub navigation and the investor-facing [GitHub Pages website](https://1998x-stack.github.io/projects/). Each project carries a small machine-readable `project.json`; the static build uses it to generate portfolio cards, category counts, filterable discovery, individual dossier pages, downloads and a sitemap.

```text
projects/
├── knowledge/                    # Research, reasoning, information synthesis
│   └── llm-xmind/
│       ├── project.json          # Portfolio entry: status, thesis, evidence, files
│       ├── README.md             # Human-readable project entrypoint
│       └── reports/
│           ├── research-2026-11.md
│           └── research-2026-11.docx
├── productivity/
│   └── anti-procrastination-todo/ # Published source-led research
├── professional/
│   └── llm-legal-assistant/      # Published legal AI research + report assets
└── infrastructure/
    └── ai-agent-landscape/        # 14-product HN × PH deep-dive
site/                             # Public site source: HTML, CSS, JS
scripts/build.mjs                 # Zero-dependency catalog + Pages generator
templates/project/                # New-project template
.github/workflows/pages.yml      # Auto-build + deploy on main
CONTRIBUTING.md                   # Editorial and evidence standards
```

## Adding a new project

1. Pick an existing category: `knowledge`, `productivity`, `professional`, or `infrastructure`. Make `projects/<category>/<slug>/` using lowercase `kebab-case` names.
2. Copy `templates/project/project.json` and `templates/project/README.md`; update `id`, `category`, `title`, `summary`, `status`, and evidence fields. The `id` must match the folder name and be globally unique.
3. Add files to `reports/` and list each file under `files` in `project.json`. Do **not** set `status: published` until a real dated deliverable exists; it also requires source citations.
4. Run `BASE_PATH=/ node scripts/build.mjs` locally to validate. Preview the `dist/` folder with a static HTTP server.
5. Push to `main`. The Pages workflow scans every project manifest and generates the new card, dossier and download links **automatically**. No homepage editing required.

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
