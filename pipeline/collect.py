"""Fetch raw items from approved sources. Returns normalized dicts; never raises for a single source."""
import json, re, urllib.request, xml.etree.ElementTree as ET
from urllib.parse import urlparse
from .validate import clean_text, safe_url

UA = {"User-Agent": "think-orbit-bot/1.0 (+https://github.com/brahmamaya)"}


def get(url, timeout=20, limit=3_000_000):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read(limit)


def parse_arxiv(xml_bytes, source):
    out = []
    root = ET.fromstring(xml_bytes)  # stdlib parser; no external entities fetched
    for it in root.iter("item"):
        t = lambda n: (it.findtext(n) or "")
        link = t("link").strip()
        desc = clean_text(t("description"), 1500)
        if "Abstract:" in desc:
            desc = desc.split("Abstract:", 1)[1].strip()
        out.append({"source_id": source["id"], "title": clean_text(t("title"), 200).replace("$", "").replace("\\", ""),
                    "url": link, "published": t("pubDate") or None,
                    "publisher": "arXiv", "abstract": desc, "kind": "research", "score_hint": 0})
    return out


MEDIA, CONTENT = "{http://search.yahoo.com/mrss/}", "{http://purl.org/rss/1.0/modules/content/}"


def find_image(it):
    """First image URL from enclosure, media:content/thumbnail, or an <img> in the item HTML."""
    enc = it.find("enclosure")
    if enc is not None and (enc.get("type") or "").startswith("image/"):
        return enc.get("url")
    for tag in ("content", "thumbnail"):
        m = it.find(MEDIA + tag)
        if m is not None and m.get("url"):
            return m.get("url")
    html = (it.findtext(CONTENT + "encoded") or "") + (it.findtext("description") or "")
    m = re.search(r"<img[^>]+src=[\"']([^\"']+)", html)
    return m.group(1) if m else None


def parse_rss(xml_bytes, source):
    """Generic RSS 2.0 parser: title, link, date, short excerpt only."""
    out = []
    for it in ET.fromstring(xml_bytes).iter("item"):
        img = find_image(it)
        host = (urlparse(img or "").hostname or "").lower()
        ok_img = safe_url(img) and any(host == h or host.endswith("." + h) for h in source.get("image_hosts", []))
        out.append({"image": img if ok_img else None, "image_credit": source.get("image_credit") if ok_img else None,"source_id": source["id"], "title": clean_text(it.findtext("title"), 200),
                    "url": (it.findtext("link") or "").strip(), "published": it.findtext("pubDate"),
                    "publisher": source.get("publisher", source["name"]),
                    "abstract": clean_text(it.findtext("description"), 600), "kind": "news", "score_hint": 0})
    return out


def parse_hn_item(d, source):
    if not d or d.get("type") != "story" or d.get("dead") or d.get("deleted") or not d.get("url"):
        return None
    host = (urlparse(d["url"]).hostname or "").removeprefix("www.")
    return {"source_id": source["id"], "title": clean_text(d.get("title"), 200), "url": d["url"],
            "published": d.get("time"), "publisher": host, "abstract": "", "kind": "news",
            "score_hint": int(d.get("score", 0)), "via": "Hacker News"}


def fetch_hn(source, limit=90):
    base = source["endpoint"]
    ids = json.loads(get(base + "topstories.json"))[:limit]
    items = []
    for i in ids:
        try:
            it = parse_hn_item(json.loads(get(f"{base}item/{int(i)}.json", 10)), source)
        except Exception:
            continue
        if it:
            items.append(it)
    return items


def fetch_source(source):
    if not safe_url(source.get("endpoint")):
        return []
    if source["id"] == "hn":
        return fetch_hn(source)
    if source["id"] == "arxiv":
        return parse_arxiv(get(source["endpoint"]), source)
    if source["access"] == "rss":
        return parse_rss(get(source["endpoint"]), source)
    return []  # unknown source type: do nothing
