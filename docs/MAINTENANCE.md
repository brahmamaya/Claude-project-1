# Maintenance
- Enable GitHub Pages: Settings → Pages → Source = GitHub Actions. Then run "Update and deploy" manually once.
- Update `config/site.json` (`base_url`, `contact_email`) before launch.
- Add a source: add an entry to `config/sources.json` with `approved:false`, review its terms, fill every rights field, then set `approved:true` and add a parser in `pipeline/collect.py` + a test.
- Skills/cases/pages: edit `site/data/{skills,cases,pages}.json` by hand; run `python -m pipeline.run` to refresh the search index. Case studies need `status:"verified"` and references before launch; never add unverified financial figures.
- Takedown: remove the item from `site/data/*.json` (or set source `approved:false`), run the pipeline, push.
- Local: `python -m unittest discover -s tests -t .`; `python -m pipeline.run`; `cd site && python -m http.server`.
- Schedule: 3 runs/day (03:17, 06:34, 12:41 UTC = 8:47 AM, 12:04 PM, 6:11 PM IST) because GitHub may delay or skip a scheduled run. Duplicates are filtered, so extra runs are harmless.
- Failure safety: pipeline writes atomically and keeps old data if no new items qualify or a feed fails.
- Legal: pages drafted in plain, conservative language (India-focused). Independent lawyer review still recommended, esp. HN commercial use, NASA image use, and DPDP wording. Add images only after rights are verified.
