"""Orchestrator. Failure-safe: any error or zero qualifying items leaves existing data untouched."""
import json, os, sys, tempfile
from datetime import datetime, timezone
from pathlib import Path
from . import collect, validate, rank, content, index

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "site" / "data"


def load(p, default=None):
    try:
        return json.loads(Path(p).read_text("utf-8"))
    except (OSError, ValueError):
        return default


def atomic_write(path, text):
    path = Path(path)
    fd, tmp = tempfile.mkstemp(dir=path.parent)
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        f.write(text)
    os.replace(tmp, path)


def process(raw, cfg, site, existing, now):
    ok = [i for i in raw if not validate.validate_item(i, now, site["max_age_days"])]
    ranked = rank.rank(ok, cfg, site["min_score"])
    fresh = rank.dedupe(ranked, existing)[: site["max_new_per_run"]]
    return [content.build_story(i, cfg["categories"], cfg["skills_hint"], now) for i in fresh]


def main():
    now = datetime.now(timezone.utc)
    site = load(ROOT / "config/site.json")
    cfg = load(ROOT / "config/categories.json")
    sources = load(ROOT / "config/sources.json")["sources"]
    news = load(DATA / "news.json", [])
    skills, cases = load(DATA / "skills.json", []), load(DATA / "cases.json", [])
    raw = []
    for s in sources:
        if not validate.source_approved(s):
            continue
        try:
            got = collect.fetch_source(s)
            print(f"{s['id']}: fetched {len(got)}")
            raw += got
        except Exception as e:  # one bad feed must not stop the run
            print(f"{s['id']}: FAILED {type(e).__name__}", file=sys.stderr)
    real = [n for n in news if not n.get("sample")]
    new = process(raw, cfg, site, real, now)
    print(f"new qualifying: {len(new)}")
    if new:
        merged = sorted(new + real, key=lambda n: n["published"], reverse=True)[: site["max_news"]]
        atomic_write(DATA / "news.json", json.dumps(merged, ensure_ascii=False, indent=1))
        news = merged
    meta = {"last_updated": now.isoformat(), "last_run_new": len(new), "sample_content": not any(not n.get("sample") for n in news)}
    atomic_write(DATA / "meta.json", json.dumps(meta))
    atomic_write(DATA / "search-index.json", json.dumps(index.search_index(news, skills, cases), ensure_ascii=False))
    atomic_write(ROOT / "site/rss.xml", index.rss(news, site["base_url"], site["name"]))
    atomic_write(ROOT / "site/sitemap.xml", index.sitemap(site["base_url"], news, skills, cases))


if __name__ == "__main__":
    main()
