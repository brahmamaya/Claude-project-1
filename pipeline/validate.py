"""URL, date and rights validation. All fetched data is untrusted."""
import ipaddress, re
from datetime import datetime, timezone
from urllib.parse import urlparse
from email.utils import parsedate_to_datetime


def safe_url(url):
    """Return url if https, public host, no credentials; else None."""
    try:
        p = urlparse((url or "").strip())
    except ValueError:
        return None
    if p.scheme != "https" or not p.hostname or p.username or p.password:
        return None
    h = p.hostname.lower()
    if h == "localhost" or h.endswith((".local", ".internal")):
        return None
    try:
        ip = ipaddress.ip_address(h)
        if not ip.is_global:
            return None
    except ValueError:
        pass
    return p.geturl()


def parse_date(value):
    """Parse unix ts / RFC822 / ISO date to aware UTC datetime, or None."""
    if value in (None, ""):
        return None
    try:
        if isinstance(value, (int, float)):
            return datetime.fromtimestamp(value, timezone.utc)
        s = str(value).strip()
        try:
            d = parsedate_to_datetime(s)
        except (TypeError, ValueError):
            d = datetime.fromisoformat(s.replace("Z", "+00:00"))
        return d if d.tzinfo else d.replace(tzinfo=timezone.utc)
    except (ValueError, OverflowError, OSError):
        return None


def clean_text(s, limit=600):
    """Strip tags/control chars; output is also escaped by the frontend."""
    s = re.sub(r"<[^>]*>", " ", s or "")
    s = re.sub(r"[\x00-\x1f\x7f]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s[:limit]


def source_approved(source):
    req = ("name", "url", "permitted_usage", "attribution", "last_reviewed")
    return bool(source.get("approved")) and all(source.get(k) for k in req)


def validate_item(it, now, max_age_days):
    """Return list of problems (empty = ok)."""
    errs = []
    if not safe_url(it.get("url")):
        errs.append("bad url")
    if not it.get("title") or len(it["title"]) < 12:
        errs.append("title")
    d = parse_date(it.get("published"))
    if not d:
        errs.append("date")
    elif (now - d).days > max_age_days or d > now:
        errs.append("age")
    if not it.get("publisher"):
        errs.append("publisher")
    return errs
