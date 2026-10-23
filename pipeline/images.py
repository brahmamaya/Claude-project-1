"""Openly licensed illustration photos from Wikimedia Commons. Failure-safe: any error -> no photo."""
import json, re, urllib.parse
from .collect import get
from .validate import clean_text, safe_url

API = "https://commons.wikimedia.org/w/api.php"
OK_LICENSE = re.compile(r"^(CC0|CC BY(-SA)? \d|Public domain|PD)", re.I)
BAD = re.compile(r"\b(NC|ND)\b|fair use|GFDL only", re.I)


def license_ok(meta):
    lic = (meta.get("LicenseShortName") or {}).get("value", "")
    if not OK_LICENSE.search(lic) or BAD.search(lic):
        return None
    if (meta.get("Restrictions") or {}).get("value"):
        return None  # e.g. personality / trademark restrictions
    return lic


def parse(resp, query):
    out = []
    for page in (resp.get("query", {}).get("pages", {}) or {}).values():
        info = (page.get("imageinfo") or [{}])[0]
        meta = info.get("extmetadata") or {}
        lic = license_ok(meta)
        url = info.get("thumburl") or ""
        host = urllib.parse.urlparse(url).hostname or ""
        if (not lic or host != "upload.wikimedia.org" or not safe_url(url)
                or info.get("mime") not in ("image/jpeg", "image/png") or info.get("width", 0) < 600
                or re.search(r"logo|icon|flag|map|diagram", page.get("title", ""), re.I)):
            continue
        artist = clean_text((meta.get("Artist") or {}).get("value", ""), 80) or "Unknown author"
        out.append({"image": url, "image_credit": f"Illustrative photo: {artist}, {lic}, via Wikimedia Commons",
                    "image_page": info.get("descriptionurl") if safe_url(info.get("descriptionurl")) else None,
                    "query": query})
    return out


def candidates(query):
    q = {"action": "query", "format": "json", "generator": "search", "gsrnamespace": 6, "gsrlimit": 12,
         "gsrsearch": f"{query} filetype:bitmap", "prop": "imageinfo", "iiprop": "url|size|mime|extmetadata",
         "iiurlwidth": 800}
    return parse(json.loads(get(API + "?" + urllib.parse.urlencode(q), 20)), query)


def build_pool(queries):
    pool = {}
    for cat, qs in queries.items():
        pool[cat] = []
        for q in qs:
            try:
                pool[cat] += candidates(q)
            except Exception:
                pass
    return pool


def fill(stories, pool):
    """Give each story without a photo one from its topic pool, chosen by id so choices are stable."""
    n = 0
    for s in stories:
        c = pool.get(s["category"]) or []
        if s.get("image") or not c or s.get("sample"):
            continue
        pick = c[int(s["id"], 16) % len(c)]
        s["image"], s["image_credit"], s["image_page"] = pick["image"], pick["image_credit"], pick["image_page"]
        n += 1
    return n
