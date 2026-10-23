import json, unittest
from datetime import datetime, timezone, timedelta
from pathlib import Path
from pipeline import validate, rank, collect, content, index, run, images

ROOT = Path(__file__).resolve().parent.parent
NOW = datetime(2026, 10, 22, tzinfo=timezone.utc)
CFG = json.loads((ROOT / "config/categories.json").read_text())


class T(unittest.TestCase):
    def test_safe_url(self):
        self.assertTrue(validate.safe_url("https://example.com/a"))
        for u in ("http://example.com", "https://127.0.0.1/x", "https://localhost/", "javascript:alert(1)", "https://u:p@example.com", ""):
            self.assertIsNone(validate.safe_url(u), u)

    def test_dates(self):
        self.assertIsNotNone(validate.parse_date(1760000000))
        self.assertIsNotNone(validate.parse_date("Wed, 22 Oct 2026 00:00:00 GMT"))
        self.assertIsNone(validate.parse_date("garbage"))

    def test_validate_item(self):
        good = {"url": "https://e.com/x", "title": "Quantum computer hits milestone", "published": (NOW - timedelta(days=1)).timestamp(), "publisher": "e.com"}
        self.assertEqual(validate.validate_item(good, NOW, 14), [])
        self.assertIn("age", validate.validate_item({**good, "published": (NOW - timedelta(days=90)).timestamp()}, NOW, 14))

    def test_dedupe_and_rank(self):
        a = {"title": "New quantum computing qubit error correction result", "url": "https://x.com/a?utm_source=z", "abstract": "", "score_hint": 0}
        b = {**a, "url": "https://www.x.com/a"}
        c = {**a, "url": "https://y.com/b", "title": "New quantum computing qubit error correction result!"}
        self.assertEqual(len(rank.dedupe([a, b, c])), 1)
        r = rank.rank([a, {"title": "Celebrity gossip about AI machine learning", "url": "https://z.com", "abstract": "", "score_hint": 0}], CFG, 3)
        self.assertEqual([x["category"] for x in r], ["quantum-computing"])

    def test_hn_and_arxiv_parse(self):
        self.assertIsNone(collect.parse_hn_item({"type": "story", "title": "Ask HN"}, {"id": "hn"}))
        x = b"<rss><channel><item><title>T paper</title><link>https://arxiv.org/abs/1</link><pubDate>Wed, 22 Oct 2026 00:00:00 GMT</pubDate><description>arXiv:1 Announce Type: new Abstract: We do things.</description></item></channel></rss>"
        self.assertEqual(collect.parse_arxiv(x, {"id": "arxiv"})[0]["abstract"], "We do things.")

    def test_generic_rss(self):
        x = b"<rss><channel><item><title>NASA tests new rocket engine</title><link>https://www.nasa.gov/a</link><pubDate>Wed, 22 Oct 2026 00:00:00 GMT</pubDate><description>&lt;p&gt;Engine test.&lt;/p&gt;</description></item></channel></rss>"
        r = collect.parse_rss(x, {"id": "nasa", "name": "NASA", "publisher": "NASA"})[0]
        self.assertEqual((r["publisher"], r["abstract"], r["kind"]), ("NASA", "Engine test.", "news"))

    def test_image_host_allowlist(self):
        mk = lambda u: ("<rss><channel><item><title>NASA tests new rocket engine</title><link>https://www.nasa.gov/a</link><enclosure url='%s' type='image/jpeg'/></item></channel></rss>" % u).encode()
        src = {"id": "nasa", "name": "NASA", "image_hosts": ["nasa.gov"], "image_credit": "NASA"}
        self.assertEqual(collect.parse_rss(mk("https://images.nasa.gov/x.jpg"), src)[0]["image"], "https://images.nasa.gov/x.jpg")
        self.assertIsNone(collect.parse_rss(mk("https://evil.example/x.jpg"), src)[0]["image"])
        self.assertIsNone(collect.parse_rss(mk("http://images.nasa.gov/x.jpg"), src)[0]["image"])

    def test_image_in_html(self):
        x = b"<rss xmlns:content='http://purl.org/rss/1.0/modules/content/'><channel><item><title>NASA tests new rocket engine</title><link>https://www.nasa.gov/a</link><content:encoded><![CDATA[<p><img src='https://www.nasa.gov/wp-content/a.jpg'></p>]]></content:encoded></item></channel></rss>"
        src = {"id": "nasa", "name": "NASA", "image_hosts": ["nasa.gov"], "image_credit": "NASA"}
        self.assertEqual(collect.parse_rss(x, src)[0]["image"], "https://www.nasa.gov/wp-content/a.jpg")

    def test_commons_license_filter(self):
        def page(lic, host="upload.wikimedia.org", restr=""):
            return {"title": "File:Rocket.jpg", "imageinfo": [{"thumburl": f"https://{host}/a.jpg", "mime": "image/jpeg", "width": 800, "descriptionurl": "https://commons.wikimedia.org/wiki/File:Rocket.jpg",
                    "extmetadata": {"LicenseShortName": {"value": lic}, "Artist": {"value": "<a>Jane Doe</a>"}, "Restrictions": {"value": restr}}}]}
        r = {"query": {"pages": {"1": page("CC BY-SA 4.0"), "2": page("CC BY-NC 4.0"), "3": page("CC BY 2.0", host="evil.example"), "4": page("Public domain", restr="personality"), "5": page("CC0")}}}
        got = images.parse(r, "rocket")
        self.assertEqual(len(got), 2)
        self.assertIn("Jane Doe, CC BY-SA 4.0, via Wikimedia Commons", got[0]["image_credit"])

    def test_fill_is_stable_and_skips_existing(self):
        pool = {"space": [{"image": "https://upload.wikimedia.org/a.jpg", "image_credit": "c", "image_page": None}]}
        st = [{"id": "00000001", "category": "space"}, {"id": "00000002", "category": "space", "image": "https://x"}]
        self.assertEqual(images.fill(st, pool), 1)
        self.assertEqual(st[1]["image"], "https://x")

    def test_hn_min_points(self):
        it = {"title": "SpaceX rocket reaches orbit again", "url": "https://a.com/x", "abstract": "", "kind": "news", "via": "Hacker News", "score_hint": 5}
        self.assertEqual(rank.rank([it], CFG, 3, 2, 50), [])
        self.assertEqual(len(rank.rank([{**it, "score_hint": 300}], CFG, 3, 2, 50)), 1)

    def test_rights_gate(self):
        src = json.loads((ROOT / "config/sources.json").read_text())["sources"]
        self.assertEqual({s["id"] for s in src if validate.source_approved(s)}, {"hn", "arxiv", "nasa", "wikimedia-commons"})

    def test_failed_run_keeps_data(self):
        self.assertEqual(run.process([], CFG, {"max_age_days": 14, "min_score": 3, "max_new_per_run": 5}, [], NOW), [])

    def test_cap_per_kind(self):
        items = [{"kind": "research"}] * 8 + [{"kind": "news"}] * 3
        out = rank.cap_per_kind(items, {"research": 6})
        self.assertEqual(sum(i["kind"] == "research" for i in out), 6)
        self.assertEqual(sum(i["kind"] == "news" for i in out), 3)

    def test_clean_text(self):
        self.assertNotIn("<", validate.clean_text("<script>x</script>hi"))

    def test_data_files(self):
        for f in ("news", "skills", "cases", "pages", "meta", "search-index"):
            self.assertTrue(json.loads((ROOT / f"site/data/{f}.json").read_text()) is not None)
        for s in json.loads((ROOT / "site/data/skills.json").read_text()):
            for r in s["resources"]:
                self.assertTrue(validate.safe_url(r["url"]))


if __name__ == "__main__":
    unittest.main()
