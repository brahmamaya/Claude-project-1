"""Dedup, classify and score relevance (keyword-based; not research)."""
import re, difflib
from urllib.parse import urlparse, parse_qsl, urlencode


def norm_url(u):
    p = urlparse(u)
    q = [(k, v) for k, v in parse_qsl(p.query) if not k.startswith("utm_")]
    return f"{p.hostname}{p.path.rstrip('/')}?{urlencode(q)}".lower().removeprefix("www.")


def norm_title(t):
    return re.sub(r"[^a-z0-9 ]", "", t.lower()).strip()


def dedupe(items, existing=()):
    seen_u = {norm_url(e["url"]) for e in existing}
    titles = [norm_title(e["title"]) for e in existing]
    out = []
    for it in items:
        u, t = norm_url(it["url"]), norm_title(it["title"])
        if u in seen_u or any(difflib.SequenceMatcher(None, t, x).ratio() > 0.85 for x in titles):
            continue
        seen_u.add(u); titles.append(t); out.append(it)
    return out


def classify(it, cfg):
    text = f"{it['title']} {it.get('abstract','')}".lower()
    low = text
    if any(w in low for w in cfg["reject"]):
        return None, 0
    best, best_s = None, 0
    for cat, c in cfg["categories"].items():
        s = sum(w for k, w in c["kw"].items() if re.search(r"\b" + re.escape(k) + r"\b", text))
        if s > best_s:
            best, best_s = cat, s
    return best, best_s


def rank(items, cfg, min_score):
    keep = []
    for it in items:
        cat, s = classify(it, cfg)
        if not cat or s < min_score:
            continue
        s += min(it.get("score_hint", 0) / 200, 2)  # popularity is a small tiebreaker
        keep.append({**it, "category": cat, "relevance": round(s, 2)})
    return sorted(keep, key=lambda x: -x["relevance"])
