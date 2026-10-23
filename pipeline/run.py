"""Orchestrator. Failure-safe: any error or zero qualifying items leaves existing data untouched."""
import json, os, sys, tempfile
from datetime import datetime, timezone
from pathlib import Path
from . import collect, validate, rank, content, index, images

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


safe_ok = validate.safe_url


def process(raw, cfg, site, existing, now):
    ok = [i for i in raw if not validate.validate_item(i, now, site["max_age_days"])]
    ranked = rank.rank(ok, cfg, site["min_score"], site.get("news_min_score"), site.get("min_hn_points", 0))
    fresh = rank.dedupe(ranked, existing)
    fresh = rank.cap_per_kind(fresh, site.get("max_per_kind", {}))[: site["max_new_per_run"]]
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
            print(f"{s['id']}: fetched {len(got)}, with image {sum(bool(g.get('image')) for g in got)}")
            raw += got
        except Exception as e:  # one bad feed must not stop the run
            print(f"{s['id']}: FAILED {type(e).__name__}", file=sys.stderr)
    real = [n for n in news if not n.get("sample")]
    imgs = {rank.norm_url(r["url"]): r for r in raw if r.get("image") and safe_ok(r["url"])}
    for n in real:  # backfill images for stories saved before image support
        r = imgs.get(rank.norm_url(n["url"]))
        if r and not n.get("image"):
            n["image"], n["image_credit"] = r["image"], "Image: " + r["image_credit"]
    new = process(raw, cfg, site, real, now)
    print(f"raw {len(raw)}, new qualifying: {len(new)} ({sum(n['source_id']=='hn' for n in new)} from HN)")
    if new or any(n.get("image") for n in real):
        keep = [n for n in new + real if (now - validate.parse_date(n["published"])).days <= site.get("max_keep_days", 45)]
        merged = sorted(keep, key=lambda n: n["published"], reverse=True)[: site["max_news"]]
        atomic_write(DATA / "news.json", json.dumps(merged, ensure_ascii=False, indent=1))
        news = merged
    try:
        pool = images.build_pool(load(ROOT / "config/images.json", {}).get("queries", {}))
        filled = images.fill(news, pool)
        print(f"commons: pool {sum(len(v) for v in pool.values())}, photos added {filled}")
        if filled:
            atomic_write(DATA / "news.json", json.dumps(news, ensure_ascii=False, indent=1))
    except Exception as e:
        print(f"commons: FAILED {type(e).__name__}", file=sys.stderr)
    meta = {"last_updated": now.isoformat(), "last_run_new": len(new), "sample_content": not any(not n.get("sample") for n in news)}
    atomic_write(DATA / "meta.json", json.dumps(meta))
    atomic_write(DATA / "search-index.json", json.dumps(index.search_index(news, skills, cases), ensure_ascii=False))
    atomic_write(ROOT / "site/rss.xml", index.rss(news, site["base_url"], site["name"]))
    atomic_write(ROOT / "site/sitemap.xml", index.sitemap(site["base_url"], news, skills, cases))


if __name__ == "__main__":
    main()
