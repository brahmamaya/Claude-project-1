# Think Orbit — Architecture (v1)

## 1. Technical architecture
Static site on GitHub Pages. Python (stdlib only, no deps) runs daily in GitHub Actions: collect → validate → rank/dedupe → build stories → search index/RSS/sitemap → tests → commit → deploy. Frontend is one hash-routed page (no framework) that reads `site/data/*.json`. Modules are separate files (see INDEX.md); sources/categories are JSON config. Moving hosts = copy `site/`.

## 2. Design system (from the 9 reference screens)
Pure black `#000`, text `#fff`, muted `#9a9a9a`, hairline `#222`. System font. Header: `think-orbit` left, search icon right. Pill filter chips (active = white fill). Thumbnail-left news cards; 16:9 featured image; outlined "Read Original Source" button; boxed "Key facts"; timeline list for cases/roadmaps. Fixed 5-tab bottom nav (line icons, active = white + top rule), safe-area padding, content padded so it never overlaps. 44px+ touch targets, no gradients/glow/animation.
Images: v1 uses only original SVG diagrams (no third-party images) until rights are verified.

## 3. Source / legal-risk assessment
| Source | Status | Risk |
|---|---|---|
| Hacker News API | approved, metadata+link only | Commercial-use terms unconfirmed → legal review |
| arXiv RSS | approved, metadata/abstract (CC0 metadata) | Papers/figures have own licences: never copied |
| Tech news RSS, company feeds | NOT approved (placeholders) | Must review terms per feed first |
Images: none from news sites. Case studies: qualitative, official-site references, marked `draft` until verified. Legal pages contain TODO(legal review). No fabricated "why it matters" per story: only labelled generic background.

## 4. Folder structure — see INDEX.md.

## 5. Milestones
M1 repo+CI/deploy ✔ · M2 design system ✔ · M3 nine screens ✔ (sample content flagged) · M4 HN+arXiv ✔ · M5 ranking/dedupe/safe publish ✔ · M6 skills library (5 seeded) · M7 cases (3 drafts → verify) · M8 search/bookmarks ✔ · M9 legal review + licensed images + more sources · M10 launch audit (Lighthouse/a11y, link check).

## 6. Test plan
Unit (tests/): URL safety, dates, validation, dedupe, rejection, parsers, rights gate, failure-safety, data integrity. Manual/E2E: all routes at 360/768/1280px, no horizontal overflow, nav never overlaps, keyboard focus, empty states, offline-feed run keeps data. Pre-launch: link check of resources, Lighthouse, legal sign-off.
