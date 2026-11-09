# Publishing & evidence standards

## Purpose

This repository is an investor-readable research and product portfolio. Every entry should tell a newcomer: **What user problem? What evidence? What thesis? What is still unknown? What is the next test?** A polished page must not be mistaken for validated market demand.

## Directory and naming convention

- Create `projects/<category>/<unique-kebab-case-slug>/project.json`.
- Categories currently recognized: `knowledge`, `productivity`, `professional`, `infrastructure`, `education`, `code`, `healthcare`. To add a new category, first update `site/config.json`; the builder will discover it.
- Keep a human-friendly `README.md` inside every project directory.
- Store research in `reports/`, product design in `design/`, prototypes in `prototype/`, and reusable assets in `assets/` as needed. Git does not track empty folders; include a `README.md` for empty categories.
- Dates use ISO `YYYY-MM-DD`. Keep each file's name predictable (`research-YYYY-MM.md`, `research-YYYY-MM.docx`).

## Research quality gate

Before declaring `status: published`:

1. Provide a real dated report and declare all downloadable files in `project.json`.
2. Cite original sources rather than relying on SEO summaries. Mark vendor claims, user comments, and independent interpretation separately.
3. Distinguish data observed at a specific date from stable product facts (especially votes, pricing and rankings).
4. State limitations: sample bias, missing independent product tests, unknown adoption, accuracy or customer willingness to pay.
5. Record actionable hypotheses and objective validation criteria. Never invent testimonials, customers, partnerships, revenue or venture metrics.
6. Validate links, run the site build, then check desktop and mobile readability.

## Minimal project manifest

Copy `templates/project/project.json` and fill in the fields. Required top-level keys include `id`, `category`, `title`, `summary`, `status`, `tags`, `findings`, `sourceLinks`, `sourceCount` and `files`. Keep `sourceCount: 0`, `findings: []`, `files: []`, `publishedAt: null` for `planned` work. For published work, include dated evidence files.

Example file declaration:

```json
{"files": [{"label":"Read research", "format":"Markdown", "path":"projects/knowledge/example/reports/research-2026-11.md"}]}
```

File paths are repository-relative and must stay within that project's `reports/` folder. The build fails on missing paths or inconsistent stages.

## Deployment checklist

```bash
node --check scripts/build.mjs
node --check site/assets/app.js
BASE_PATH=/ node scripts/build.mjs
python3 -m http.server 4173 --directory dist
```

Check: category cards, project search and status filters; project dossier content and dates; source links and file downloads; responsive layout; keyboard navigation; no console errors. The GitHub Actions workflow builds with `BASE_PATH=/projects/` for GitHub Pages.

For a new public Pages site, set **Settings → Pages → Source: GitHub Actions** once. This setting is repository administration and is separate from committing the workflow.

## Investor-facing language policy

Use **"research hypothesis"** until the opportunity is experimentally validated. Use **"prototype"** only for actual working implementations. Describe customer adoption, revenue and fundraising only with date-scoped, verifiable metrics and disclosures. Avoid artificial social proof, fictional logos, fabricated badges or invented growth charts.
