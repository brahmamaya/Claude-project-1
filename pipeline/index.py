"""Search index, RSS and sitemap generation."""
import json
from xml.sax.saxutils import escape


def search_index(news, skills, cases):
    rec = []
    for n in news:
        rec.append({"t": "news", "id": n["id"], "title": n["title"], "cat": n["category_label"], "text": n["summary"][:200]})
    for s in skills:
        rec.append({"t": "skills", "id": s["id"], "title": s["title"], "cat": s["category"], "text": s["summary"]})
    for c in cases:
        rec.append({"t": "cases", "id": c["id"], "title": c["company"] + ": " + c["title"], "cat": c["industry"], "text": c["problem"]})
    return rec


def rss(news, base, name):
    items = "".join(
        f"<item><title>{escape(n['title'])}</title><link>{escape(base)}#/news/{n['id']}</link>"
        f"<guid isPermaLink='false'>{n['id']}</guid><description>{escape(n['summary'])}</description></item>"
        for n in news[:30] if not n.get("sample"))
    return (f"<?xml version='1.0' encoding='UTF-8'?><rss version='2.0'><channel><title>{escape(name)}</title>"
            f"<link>{escape(base)}</link><description>Understand Tomorrow. Today.</description>{items}</channel></rss>")


def sitemap(base, news, skills, cases):
    urls = [base] + [f"{base}#/{p}" for p in ("news", "future", "skills", "cases", "explore")]
    urls += [f"{base}#/news/{n['id']}" for n in news if not n.get("sample")]
    urls += [f"{base}#/skills/{s['id']}" for s in skills] + [f"{base}#/cases/{c['id']}" for c in cases]
    return ("<?xml version='1.0' encoding='UTF-8'?><urlset xmlns='http://www.sitemaps.org/schemas/sitemap/0.9'>"
            + "".join(f"<url><loc>{escape(u)}</loc></url>" for u in urls) + "</urlset>")
