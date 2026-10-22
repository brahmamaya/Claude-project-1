"""Deterministic editorial templates. No invented facts: only source fields + labelled context."""
import hashlib
from datetime import datetime, timezone
from .validate import parse_date

CONTEXT = {  # generic, clearly-labelled background (not claims about this story)
 "artificial-intelligence": "AI is software that learns patterns from data. Research here can change how many jobs and tools work.",
 "robotics": "Robotics combines machines, sensors and software so machines can do physical tasks.",
 "space": "Space technology covers rockets, satellites and science missions.",
 "energy": "Energy technology is about producing, storing and using power more cleanly or cheaply.",
 "biotechnology": "Biotechnology uses biology, such as genes and proteins, to build medicines and materials.",
 "semiconductors": "Semiconductors are the chips inside almost every modern device.",
 "quantum-computing": "Quantum computers use quantum physics to solve certain problems differently from normal computers.",
 "cybersecurity": "Cybersecurity is about protecting systems and data from misuse.",
 "advanced-manufacturing": "Advanced manufacturing uses automation and new methods to make things better or faster."}


def item_id(url):
    return hashlib.sha1(url.encode()).hexdigest()[:10]


def first_sentences(text, n=2, limit=320):
    parts = [p.strip() for p in text.replace("\n", " ").split(". ") if p.strip()]
    s = ". ".join(parts[:n])
    s = s if s.endswith(".") or not s else s + "."
    return s[:limit]


def diagram_svg(label):
    """Original, text-only SVG placeholder (no third-party imagery)."""
    label = "".join(c for c in label if c.isalnum() or c in " -")[:40]
    return ("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 180' role='img' aria-label='%s'>"
            "<rect width='320' height='180' fill='#0b0b0b'/><circle cx='160' cy='90' r='50' fill='none' stroke='#fff' stroke-width='1.5'/>"
            "<ellipse cx='160' cy='90' rx='78' ry='24' fill='none' stroke='#888' transform='rotate(-20 160 90)'/>"
            "<circle cx='222' cy='72' r='5' fill='#fff'/></svg>") % label


def build_story(it, cats, skills_hint, now):
    d = parse_date(it["published"])
    cat = it["category"]
    label = cats[cat]["label"]
    summary = first_sentences(it["abstract"]) if it.get("abstract") else \
        f"This story was published by {it['publisher']}. Open the original source for the full details."
    facts = [f"Publisher: {it['publisher']}", f"Published: {d.date().isoformat()}", f"Topic: {label}"]
    if it.get("via"):
        facts.append(f"Found via {it['via']} (community score {int(it['score_hint'])})")
    if it["kind"] == "research":
        facts.append("Type: research preprint (not yet peer reviewed unless stated by the authors)")
    return {"id": item_id(it["url"]), "title": it["title"], "category": cat, "category_label": label,
            "published": d.isoformat(), "publisher": it["publisher"], "url": it["url"],
            "source_id": it["source_id"], "via": it.get("via"), "summary": summary,
            "key_facts": facts, "context": CONTEXT[cat], "context_label": "Background (editorial, not from the source)",
            "why_matters": None, "skills": skills_hint.get(cat, []),
            "image": it.get("image"), "image_credit": ("Image: " + it["image_credit"]) if it.get("image") else None, "diagram": diagram_svg(label),
            "kind": it["kind"], "relevance": it["relevance"], "added": now.isoformat(), "sample": False}
