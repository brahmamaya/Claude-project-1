"use strict";
const $ = (s) => document.querySelector(s), app = $("#app");
const D = {}, ICON = {
  home: "M3 11l9-8 9 8M5 10v10h14V10", future: "M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M12 12m-9 0a9 4 0 1 0 18 0a9 4 0 1 0-18 0", skills: "M12 3l9 5-9 5-9-5zM7 11v5c3 3 7 3 10 0v-5",
  cases: "M4 7h16v12H4zM9 7V4h6v3", explore: "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0M15 9l-2 5-5 1 2-5z", search: "M11 11m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0M20 20l-4-4",
  back: "M15 5l-7 7 7 7", save: "M6 3h12v18l-6-4-6 4z", share: "M12 3v12M8 7l4-4 4 4M5 13v8h14v-8", ext: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6", chev: "M9 5l7 7-7 7"
};
const ic = (n) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICON[n]}"/></svg>`;
const T = (t) => String(t ?? "").replace(/[$\\]/g, "");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const safe = (u) => { try { const x = new URL(u); return x.protocol === "https:" ? x.href : ""; } catch { return ""; } };
const CATS = { "artificial-intelligence": "Artificial Intelligence", robotics: "Robotics", space: "Space", energy: "Energy", biotechnology: "Biotechnology", semiconductors: "Semiconductors", "quantum-computing": "Quantum Computing", cybersecurity: "Cybersecurity", "advanced-manufacturing": "Advanced Manufacturing" };
const TABS = [["home", "Home", "#/"], ["future", "Future", "#/future"], ["skills", "Skills", "#/skills"], ["cases", "Cases", "#/cases"], ["explore", "Explore", "#/explore"]];
const store = { get: () => { try { return JSON.parse(localStorage.getItem("to-saved") || "[]"); } catch { return []; } }, set: (v) => { try { localStorage.setItem("to-saved", JSON.stringify(v)); } catch { } } };

async function load(name) {
  if (D[name]) return D[name];
  try { const r = await fetch(`data/${name}.json`); if (!r.ok) throw 0; return (D[name] = await r.json()); } catch { return (D[name] = []); }
}
const ago = (iso) => { const m = (Date.now() - new Date(iso)) / 6e4; if (isNaN(m)) return ""; if (m < 60) return `${Math.max(1, m | 0)} min ago`; if (m < 1440) return `${(m / 60) | 0} hours ago`; return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }); };
const orbit = `<svg viewBox="0 0 320 180" role="img" aria-label="Orbit diagram"><rect width="320" height="180" fill="#0b0b0b"/><circle cx="160" cy="90" r="42" fill="none" stroke="#fff" stroke-width="1.5"/><ellipse cx="160" cy="90" rx="78" ry="24" fill="none" stroke="#888" transform="rotate(-20 160 90)"/><circle cx="222" cy="72" r="5" fill="#fff"/></svg>`;
const A = { // original line illustrations, one per topic (no third-party images)
  "artificial-intelligence": '<circle cx="90" cy="60" r="9"/><circle cx="90" cy="120" r="9"/><circle cx="160" cy="40" r="9"/><circle cx="160" cy="90" r="9"/><circle cx="160" cy="140" r="9"/><circle cx="230" cy="90" r="11"/><path d="M99 60L151 40M99 60L151 90M99 120L151 90M99 120L151 140M99 60L151 140M169 40L219 90M169 90L219 90M169 140L219 90"/>',
  robotics: '<rect x="105" y="55" width="110" height="80" rx="14"/><circle cx="140" cy="90" r="8"/><circle cx="180" cy="90" r="8"/><path d="M135 118h50M160 55V35M160 35m-5 0a5 5 0 1 0 10 0a5 5 0 1 0-10 0M105 85H90M215 85h15"/>',
  space: '<circle cx="160" cy="90" r="40"/><ellipse cx="160" cy="90" rx="85" ry="22" transform="rotate(-20 160 90)"/><circle cx="60" cy="40" r="2"/><circle cx="265" cy="45" r="2"/><circle cx="250" cy="140" r="2"/><circle cx="55" cy="140" r="2"/>',
  energy: '<path d="M175 25L110 100h45l-10 55 65-80h-45z"/><circle cx="160" cy="90" r="70" stroke-dasharray="3 6"/>',
  biotechnology: '<path d="M100 20C100 60 220 70 220 110S100 150 100 160M220 20C220 60 100 70 100 110S220 150 220 160"/><path d="M122 45h76M118 90h84M122 135h76"/>',
  semiconductors: '<rect x="110" y="50" width="100" height="80" rx="6"/><rect x="135" y="72" width="50" height="36"/><path d="M125 50V35M160 50V35M195 50V35M125 130v15M160 130v15M195 130v15M110 70H95M110 110H95M210 70h15M210 110h15"/>',
  "quantum-computing": '<ellipse cx="160" cy="90" rx="80" ry="26"/><ellipse cx="160" cy="90" rx="80" ry="26" transform="rotate(60 160 90)"/><ellipse cx="160" cy="90" rx="80" ry="26" transform="rotate(120 160 90)"/><circle cx="160" cy="90" r="6" fill="#fff"/>',
  cybersecurity: '<path d="M160 25l60 22v40c0 32-26 55-60 68-34-13-60-36-60-68V47z"/><rect x="143" y="88" width="34" height="28" rx="4"/><path d="M150 88v-8a10 10 0 0 1 20 0v8"/>',
  "advanced-manufacturing": '<circle cx="160" cy="90" r="30"/><circle cx="160" cy="90" r="12"/><path d="M160 40v14M160 126v14M110 90h14M196 90h14M125 55l10 10M185 115l10 10M195 55l-10 10M135 115l-10 10"/>',
  business: '<path d="M80 140V90M120 140V60M160 140V100M200 140V40M240 140V70M70 145h180"/>',
  creative: '<path d="M160 30a42 42 0 0 0-20 79v14h40v-14a42 42 0 0 0-20-79zM148 135h24M152 148h16"/>'
};
const ALIAS = { AI: "artificial-intelligence", "Artificial Intelligence": "artificial-intelligence", Robotics: "robotics", Space: "space", Energy: "energy", Semiconductors: "semiconductors", Tech: "semiconductors", Business: "business", Creative: "creative", Biotechnology: "biotechnology", Cybersecurity: "cybersecurity" };
const art = (k) => { const body = A[k] || A[ALIAS[k]]; return body ? `<svg viewBox="0 0 320 180" role="img" aria-label="Illustration"><rect width="320" height="180" fill="#0b0b0b"/><g fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>` : orbit; };
const visual = (n) => n.image && safe(n.image) ? `<img src="${esc(safe(n.image))}" alt="" loading="lazy" decoding="async">` : art(n.category);

const newsCard = (n) => `<a class="card" href="#/news/${esc(n.id)}"><div class="thumb">${visual(n)}</div><div><div class="t">${esc(T(n.title))}</div><div class="mute">${esc(n.category_label)}${n.kind === "research" ? " · Research" : ""} · ${ago(n.published)}</div></div></a>`;
const skillRow = (s) => `<a class="link" href="#/skills/${esc(s.id)}"><div><div class="t">${esc(s.title)}</div><div class="mute">${esc(s.summary)}</div></div>${ic("chev")}</a>`;
const caseCard = (c) => `<a class="card" href="#/cases/${esc(c.id)}"><div class="thumb">${art(c.industry)}</div><div><div class="t">${esc(c.company)}: ${esc(c.title)}</div><div class="mute">${esc(c.industry)} · ${esc(c.status === "draft" ? "Reviewed" : "Verified")}</div></div></a>`;
const chips = (list, cur, attr) => `<div class="chips" role="group">${list.map(([v, l]) => `<button class="chip" ${attr}="${esc(v)}" aria-pressed="${v === cur}">${esc(l)}</button>`).join("")}</div>`;
const sampleNote = (items) => items.some((n) => n.sample) ? `<p class="notice">Sample content for layout. Real stories appear after the first automated update.</p>` : "";
const bar = (id, extra = "") => `<div class="bar"><a class="icon-btn" href="javascript:history.length>1?history.back():location.hash='#/'" aria-label="Back">${ic("back")}</a><span>${extra}</span></div>`;
const foot = () => `<footer>${["about", "contact", "privacy", "terms", "copyright", "corrections", "sources"].map((p) => `<a href="#/page/${p}">${p[0].toUpperCase() + p.slice(1)}</a>`).join("")}<a href="rss.xml">RSS</a></footer>`;
function saveBtn(key) { const on = store.get().includes(key); return `<button class="icon-btn" data-save="${esc(key)}" aria-label="${on ? "Remove from saved" : "Save"}" aria-pressed="${on}">${ic("save")}</button>`; }
const shareBtn = (t) => `<button class="icon-btn" data-share="${esc(t)}" aria-label="Share">${ic("share")}</button>`;

const R = {
  async home() {
    const [rawNews, skills, cases, meta] = await Promise.all([load("news"), load("skills"), load("cases"), load("meta")]); const news = lead(rawNews);
    const f = news[0];
    return `<section class="hero"><p class="eyebrow">The future starts here</p><h1>Understand Tomorrow. Today.</h1><p class="mute">Technologies, skills and ideas shaping our future, in simple language.</p></section>
${sampleNote(news)}<div class="row"><h2>Today's Future News</h2><a href="#/news">See All ›</a></div>
${f ? `<a class="feat" href="#/news/${esc(f.id)}"><div class="hero-img">${visual(f)}</div><div class="t">${esc(T(f.title))}</div><div class="mute">${esc(f.category_label)} · ${ago(f.published)}</div></a>${news.slice(1, 4).map(newsCard).join("")}` : `<p class="empty">No stories yet.</p>`}
<div class="row"><h2>Future Skills</h2><a href="#/skills">See All ›</a></div>${skills.slice(0, 3).map(skillRow).join("")}
<div class="row"><h2>Business Cases</h2><a href="#/cases">See All ›</a></div>${cases.slice(0, 2).map(caseCard).join("")}
<p class="mute" style="margin-top:20px">Last updated: ${meta.last_updated ? new Date(meta.last_updated).toLocaleString() : "—"}</p>${foot()}`;
  },
  async news() {
    const news = await load("news"); const cat = qs().get("c") || "all";
    const list = cat === "all" ? news : news.filter((n) => n.category === cat);
    return `<h1>Future News</h1><p class="mute">All stories, newest first.</p>${chips([["all", "All"], ...Object.entries(CATS)], cat, "data-nc")}${sampleNote(news)}${list.map(newsCard).join("") || `<p class="empty">No stories in this topic yet. We never publish filler.</p>`}`;
  },
  async newsDetail(id) {
    const [news, skills] = await Promise.all([load("news"), load("skills")]); const n = news.find((x) => x.id === id);
    if (!n) return notFound();
    const rel = news.filter((x) => x.category === n.category && x.id !== n.id).slice(0, 3);
    const sk = (n.skills || []).map((s) => skills.find((k) => k.id === s)).filter(Boolean);
    const src = safe(n.url);
    return `${bar(id, saveBtn("news:" + id) + shareBtn(n.title))}<h1>${esc(T(n.title))}</h1>
<p class="mute"><span class="tag">${esc(n.category_label)}</span>${esc(n.publisher)} · ${new Date(n.published).toLocaleDateString()}${n.via ? " · via " + esc(n.via) : ""}</p>
<div class="hero-img">${visual(n)}</div>${n.image_credit ? `<p class="mute">Image: ${esc(n.image_credit)}</p>` : ""}${n.sample ? `<p class="notice">Sample content. Not a real story.</p>` : ""}
<h2>What happened</h2><p>${esc(n.summary)}</p>
<div class="box"><h2>Key facts</h2><ul class="plain">${(n.key_facts || []).map((k) => `<li>${esc(k)}</li>`).join("")}</ul></div>
${n.context ? `<div class="box"><h2>Why it could matter</h2><p>${esc(n.context)}</p><p class="mute">${esc(n.context_label || "")}</p></div>` : ""}
${sk.length ? `<h2>Related skills</h2>${sk.map(skillRow).join("")}` : ""}
${src ? `<a class="btn" href="${esc(src)}" target="_blank" rel="noopener noreferrer">Read Original Source ${ic("ext")}</a>` : ""}
${rel.length ? `<div class="row"><h2>Related stories</h2></div>${rel.map(newsCard).join("")}` : ""}`;
  },
  async future(cat) {
    const news = lead(await load("news")); const list = !cat || cat === "all" ? news : news.filter((n) => n.category === cat); const f = list[0];
    return `<h1>Future</h1><p class="mute">Explore the technologies that will shape our world.</p>${chips([["all", "All"], ...Object.entries(CATS)], cat || "all", "data-fc")}${sampleNote(list)}
${f ? `<a class="feat" href="#/news/${esc(f.id)}"><div class="hero-img">${visual(f)}</div><div class="t">${esc(T(f.title))}</div><div class="mute">${esc(f.category_label)} · ${ago(f.published)}</div></a>${list.slice(1).map(newsCard).join("")}` : `<p class="empty">No verified developments in this topic yet.</p>`}`;
  },
  async skills() {
    const skills = await load("skills"); const cat = qs().get("c") || "all";
    const cs = [...new Set(skills.map((s) => s.category))]; const list = cat === "all" ? skills : skills.filter((s) => s.category === cat); const f = list[0];
    return `<h1>Skills</h1><p class="mute">Skills that may be useful in the future. None guarantees a job.</p>${chips([["all", "All"], ...cs.map((c) => [c, c])], cat, "data-sc")}
${f ? `<div class="box"><span class="tag">${esc(f.category)}</span><h2 style="margin:8px 0 4px">Learn ${esc(T(f.title))}</h2><p class="mute">${esc(f.summary)}</p><a class="btn" href="#/skills/${esc(f.id)}">View Learning Resources</a></div>` : ""}
<div class="row"><h2>More Skills</h2></div>${list.slice(1).map(skillRow).join("") || (list.length ? "" : `<p class="empty">No skills here yet.</p>`)}`;
  },
  async skillDetail(id) {
    const skills = await load("skills"); const s = skills.find((x) => x.id === id); if (!s) return notFound();
    const rel = (s.related_skills || []).map((t) => skills.find((k) => k.title === t)).filter(Boolean);
    const ul = (a) => `<ul class="plain">${(a || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
    return `${bar(id, saveBtn("skills:" + id) + shareBtn(s.title))}<span class="tag">${esc(s.category)}</span><h1>${esc(s.title)}</h1><p>${esc(s.summary)}</p>
<div class="box"><h2>What you will learn</h2>${ul(s.learn)}</div><div class="box"><h2>Prerequisites</h2>${ul(s.prerequisites)}</div>
<div class="box"><h2>Roadmap</h2><ol class="tl">${(s.roadmap || []).map((r) => `<li>${esc(r)}</li>`).join("")}</ol></div>
<h2>Learning resources</h2>${(s.resources || []).map((r) => `<a class="link" href="${esc(safe(r.url))}" target="_blank" rel="noopener noreferrer"><div><div class="t">${esc(r.title)}</div><div class="mute">${esc(r.type)} · ${esc(r.meta)} · checked ${esc(r.reviewed)}</div></div>${ic("ext")}</a>`).join("")}
<div class="box"><h2>Practice ideas</h2>${ul(s.practice)}</div><div class="box"><h2>Career applications</h2>${ul(s.careers)}<p class="mute">${esc(s.note)}</p></div>
<div class="box"><h2>Related technologies</h2><p>${(s.technologies || []).map((t) => `<a class="tag" href="#/search?q=${encodeURIComponent(t)}">${esc(t)}</a>`).join("")}</p></div>
${rel.length ? `<h2>Related skills</h2>${rel.map(skillRow).join("")}` : ""}`;
  },
  async cases() {
    const cases = await load("cases"); const cat = qs().get("c") || "all"; const q = (qs().get("q") || "").toLowerCase();
    const inds = [...new Set(cases.map((c) => c.industry))];
    const list = cases.filter((c) => (cat === "all" || c.industry === cat) && (!q || (c.company + c.title + c.problem).toLowerCase().includes(q)));
    return `<h1>Business Case Studies</h1><p class="mute">Learn from companies building the future.</p>
<form class="search" role="search" data-cq>${ic("search")}<input type="search" name="q" value="${esc(q)}" placeholder="Search case studies" aria-label="Search case studies"></form>${chips([["all", "All"], ...inds.map((i) => [i, i])], cat, "data-cc")}
${list.map(caseCard).join("") || `<p class="empty">No case studies match.</p>`}`;
  },
  async caseDetail(id) {
    const cases = await load("cases"); const c = cases.find((x) => x.id === id); if (!c) return notFound();
    const ul = (a) => `<ul class="plain">${(a || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
    return `${bar(id, saveBtn("cases:" + id) + shareBtn(c.company))}<div class="hero-img">${art(c.industry)}</div><span class="tag">${esc(c.industry)}</span>${c.status === "draft" ? `<span class="tag">Draft</span>` : `<span class="tag">Reviewed ${esc(c.last_reviewed || "")}</span>`}
<h1>${esc(c.company)}: ${esc(c.title)}</h1>
<h2>1. Company overview</h2><p>${esc(c.overview)}</p><h2 style="margin-top:16px">2. Problem solved</h2><p>${esc(c.problem)}</p>
<h2 style="margin-top:16px">3. Innovation</h2><p>${esc(c.innovation)}</p><h2 style="margin-top:16px">4. Business model</h2><p>${esc(c.model)}</p><h2 style="margin-top:16px">5. Technology</h2><p>${esc(c.technology)}</p>
<h2 style="margin-top:16px">6. Key milestones</h2><ol class="tl">${(c.milestones || []).map(([y, t]) => `<li><b>${esc(y)}</b> &nbsp;${esc(t)}</li>`).join("")}</ol>
<div class="box"><h2>Competitive advantages</h2>${ul(c.advantages)}</div><div class="box"><h2>Challenges</h2>${ul(c.challenges)}</div>
<div class="box"><h2>What we can learn</h2><p>${esc(c.lesson)}</p>${ul(c.lessons)}</div><div class="box"><h2>Possible future implications</h2><p>${esc(c.future)}</p></div>
<h2>References</h2>${(c.references || []).map((r) => `<a class="link" href="${esc(safe(r.url))}" target="_blank" rel="noopener noreferrer"><span>${esc(r.title)}</span>${ic("ext")}</a>`).join("")}`;
  },
  async explore() {
    const [news, skills, cases] = await Promise.all([load("news"), load("skills"), load("cases")]); const saved = store.get();
    return `<h1>Explore</h1><p class="mute">Search news, skills, companies and more.</p>
<form class="search" role="search" data-sq>${ic("search")}<input type="search" name="q" placeholder="Search topics, companies or skills" aria-label="Search"></form>
<div class="chips">${[["news", "News"], ["skills", "Skills"], ["cases", "Cases"]].map(([t, l]) => `<a class="chip" style="display:grid;place-items:center" href="#/search?t=${t}">${l}</a>`).join("")}</div>
<div class="row"><h2>Popular topics</h2></div><div class="chips" style="flex-wrap:wrap">${Object.entries(CATS).map(([k, v]) => `<a class="chip" style="display:grid;place-items:center" href="#/future/${k}">${esc(v)}</a>`).join("")}</div>
<div class="row"><h2>Emerging skills</h2><a href="#/skills">See All ›</a></div>${skills.slice(0, 3).map(skillRow).join("")}
<div class="row"><h2>Company profiles</h2><a href="#/cases">See All ›</a></div>${cases.map(caseCard).join("")}
<div class="row"><h2>Latest content</h2></div>${news.slice(0, 3).map(newsCard).join("")}
<div class="row"><h2>Saved</h2></div>${savedList(saved, news, skills, cases)}`;
  },
  async search() {
    const idx = await load("search-index"); const q = (qs().get("q") || "").trim(), t = qs().get("t") || "all";
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    const hit = (r) => terms.every((w) => (r.title + " " + r.cat + " " + r.text).toLowerCase().includes(w));
    const res = idx.filter((r) => (t === "all" || r.t === t) && (!terms.length || hit(r)));
    const cnt = { news: "News", skills: "Skills", cases: "Cases" };
    return `${bar("", "")}<h1 class="sr">Search</h1><form class="search" role="search" data-sq>${ic("search")}<input type="search" name="q" value="${esc(q)}" placeholder="Search" aria-label="Search" autofocus></form>
<div class="chips">${[["all", "All"], ...Object.entries(cnt)].map(([v, l]) => `<a class="chip" aria-pressed="${v === t}" style="display:grid;place-items:center" href="#/search?q=${encodeURIComponent(q)}&t=${v}">${l}</a>`).join("")}</div>
${terms.length || t !== "all" ? `<p class="mute">${res.length} result${res.length === 1 ? "" : "s"}</p>` : ""}
${res.map((r) => `<a class="card" href="#/${r.t}/${esc(r.id)}"><div><div class="t">${esc(r.title)}</div><div class="mute">${cnt[r.t]} · ${esc(r.cat)}</div></div></a>`).join("") || `<div class="empty"><p>No results${q ? ` for “${esc(q)}”` : ""}.</p><p class="mute">Try a shorter word, or browse <a href="#/explore" style="text-decoration:underline">Explore</a>.</p></div>`}`;
  },
  async page(slug) {
    const p = (await load("pages"))[slug]; if (!p) return notFound();
    return `${bar("")}<h1>${esc(p.title)}</h1>${p.body.map((x) => `<p style="margin:12px 0">${esc(x)}</p>`).join("")}${foot()}`;
  }
};
function savedList(saved, news, skills, cases) {
  const out = saved.map((k) => { const [t, id] = k.split(":"); if (t === "news") { const n = news.find((x) => x.id === id); return n && newsCard(n); } if (t === "skills") { const s = skills.find((x) => x.id === id); return s && skillRow(s); } const c = cases.find((x) => x.id === id); return c && caseCard(c); }).filter(Boolean);
  return out.join("") || `<p class="mute">Nothing saved yet. Use the bookmark icon on any page.</p>`;
}
const lead = (a) => [...a.filter((n) => n.kind !== "research"), ...a.filter((n) => n.kind === "research")]; // plain-language news first, papers after
const notFound = () => `${bar("")}<div class="empty"><h1>Not found</h1><p>This page does not exist.</p><a class="btn" href="#/">Go home</a></div>`;
const hashParts = () => { const [p, q = ""] = (location.hash.slice(1) || "/").split("?"); return [p.split("/").filter(Boolean), new URLSearchParams(q)]; };
const qs = () => hashParts()[1];

async function route() {
  const [p] = hashParts(), [a, b] = p; let html, tab = a || "home";
  try {
    if (!a) html = await R.home();
    else if (a === "news") html = b ? await R.newsDetail(b) : await R.news();
    else if (a === "future") html = await R.future(b);
    else if (a === "skills") html = b ? await R.skillDetail(b) : await R.skills();
    else if (a === "cases") html = b ? await R.caseDetail(b) : await R.cases();
    else if (a === "explore") html = await R.explore();
    else if (a === "search") { html = await R.search(); tab = "explore"; }
    else if (a === "page") { html = await R.page(b); tab = ""; }
    else html = notFound();
  } catch (e) { html = `<div class="empty"><p>Something went wrong. Please reload.</p></div>`; }
  app.innerHTML = html;
  document.title = (a && app.querySelector("h1") ? app.querySelector("h1").textContent + " — " : "") + "think-orbit";
  $("#tabs").querySelectorAll("a").forEach((x) => x.dataset.t === tab ? x.setAttribute("aria-current", "page") : x.removeAttribute("aria-current"));
  window.scrollTo(0, 0); app.focus({ preventScroll: true });
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-nc],[data-sc],[data-cc],[data-fc],[data-save],[data-share]"); if (!t) return;
  const d = t.dataset;
  if (d.fc !== undefined) location.hash = d.fc === "all" ? "#/future" : "#/future/" + d.fc;
  else if (d.nc !== undefined) location.hash = "#/news?c=" + d.nc;
  else if (d.sc !== undefined) location.hash = "#/skills?c=" + encodeURIComponent(d.sc);
  else if (d.cc !== undefined) location.hash = "#/cases?c=" + encodeURIComponent(d.cc);
  else if (d.save) { const s = store.get(), i = s.indexOf(d.save); i < 0 ? s.push(d.save) : s.splice(i, 1); store.set(s); const on = i < 0; t.setAttribute("aria-pressed", on); t.setAttribute("aria-label", on ? "Remove from saved" : "Save"); }
  else if (d.share) { const data = { title: d.share, url: location.href }; navigator.share ? navigator.share(data).catch(() => { }) : navigator.clipboard && navigator.clipboard.writeText(location.href).then(() => alert("Link copied")); }
});
document.addEventListener("submit", (e) => {
  const f = e.target; if (f.dataset.sq === undefined && f.dataset.cq === undefined) return; e.preventDefault();
  const q = new FormData(f).get("q").trim();
  location.hash = f.dataset.cq !== undefined ? "#/cases?q=" + encodeURIComponent(q) : "#/search?q=" + encodeURIComponent(q);
});
$("#tabs").innerHTML = `<div class="tabs-in">${TABS.map(([k, l, h]) => `<a href="${h}" data-t="${k}">${ic(k)}<span>${l}</span></a>`).join("")}</div>`;
$("#hsearch").innerHTML = ic("search");
addEventListener("hashchange", route); route();
