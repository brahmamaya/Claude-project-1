"""Check that learning/reference links respond. Run in CI; prints failures, exits 1 if any."""
import json, sys, urllib.request
from pathlib import Path
from .validate import safe_url
DATA = Path(__file__).resolve().parent.parent / "site" / "data"


def urls():
    for s in json.loads((DATA / "skills.json").read_text("utf-8")):
        for r in s["resources"]:
            yield r["url"]
    for c in json.loads((DATA / "cases.json").read_text("utf-8")):
        for r in c["references"]:
            yield r["url"]


def ok(u):
    if not safe_url(u):
        return False
    try:
        req = urllib.request.Request(u, headers={"User-Agent": "think-orbit-linkcheck/1.0"})
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status < 400
    except Exception:
        return False


if __name__ == "__main__":
    bad = [u for u in sorted(set(urls())) if not ok(u)]
    for u in bad:
        print("BROKEN:", u)
    print(f"checked, {len(bad)} broken")
    sys.exit(1 if bad else 0)
