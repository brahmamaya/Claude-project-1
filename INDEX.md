# Think Orbit — Repo Index (read this first, scan nothing else)

| Need | File |
|---|---|
| Architecture, design system, legal risk, milestones, test plan | docs/ARCHITECTURE.md |
| Maintenance / runbook | docs/MAINTENANCE.md |
| Source-rights registry (only `approved` sources publish) | config/sources.json |
| Topics + keyword weights + threshold | config/categories.json |
| Site settings (base URL, limits) | config/site.json |
| Pipeline entry (`python -m pipeline.run`) | pipeline/run.py |
| Fetch HN/arXiv (untrusted data) | pipeline/collect.py |
| URL/date/rights validation | pipeline/validate.py |
| Dedup + relevance score | pipeline/rank.py |
| Deterministic editorial templates + SVG visuals | pipeline/content.py |
| Search index, RSS, sitemap | pipeline/index.py |
| Frontend (single page, hash routes) | site/index.html, site/js/app.js, site/css/app.css |
| Data served to frontend | site/data/{news,skills,cases,pages,search-index,meta}.json |
| Tests | tests/test_pipeline.py (`python -m unittest`) |
| CI/deploy | .github/workflows/{daily,ci}.yml |

Routes: `#/` `#/news` `#/news/<id>` `#/future[/<cat>]` `#/skills` `#/skills/<id>` `#/cases` `#/cases/<id>` `#/explore` `#/search?q=` `#/page/<slug>`
Frontend never edited by pipeline; pipeline only writes site/data/*, rss.xml, sitemap.xml.
