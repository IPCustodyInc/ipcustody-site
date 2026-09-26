#!/usr/bin/env python3
"""Check that every internal link/asset in the site resolves (files + #fragments),
that no internal link starts with '/', that basic tag nesting is balanced, that every
page has the shared header/nav/footer and SEO tags, that 404.html uses absolute
site URLs, and that sitemap.xml / robots.txt exist and match the pages."""
import os, sys, re
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote

SITE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
BASE = "https://ipcustodyinc.github.io/ipcustody-site/"
REQUIRED_PAGES = ["index.html", "how-it-works.html", "features.html", "pricing.html", "prior-art.html",
                  "proof-tool.html", "certificate.html", "compare.html", "legal-validity.html", "toolkit.html",
                  "playbook.html", "law-firms.html", "faq.html", "about.html", "contact.html", "legal.html", "404.html"]
NAV_LINKS = ["index.html", "how-it-works.html", "features.html", "pricing.html", "prior-art.html",
             "proof-tool.html", "certificate.html", "law-firms.html", "faq.html"]
VOID = {"area","base","br","col","embed","hr","img","input","link","meta","source","track","wbr","path","rect","circle"}

class P(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links, self.ids, self.stack, self.errors = [], set(), [], []
        self.meta, self.tags, self.nav = {}, set(), []
        self._in_nav = 0
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        self.tags.add(tag)
        if tag == "meta":
            k = a.get("name") or a.get("property")
            if k: self.meta[k] = a.get("content") or ""
        if tag == "link" and a.get("rel") == "icon": self.meta["icon"] = a.get("href")
        if tag == "nav" and a.get("id") == "site-nav": self._in_nav = 1
        elif tag == "nav" and self._in_nav: self._in_nav += 1
        if tag == "a" and self._in_nav and a.get("href"): self.nav.append(a["href"])
        if "id" in a: self.ids.add(a["id"])
        for k in ("href", "src"):
            if k in a and a[k] is not None:
                self.links.append((tag, k, a[k], self.getpos()[0]))
        if tag not in VOID: self.stack.append((tag, self.getpos()[0]))
    def handle_startendtag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a: self.ids.add(a["id"])
        for k in ("href", "src"):
            if k in a: self.links.append((tag, k, a[k], self.getpos()[0]))
    def handle_endtag(self, tag):
        if tag == "nav" and self._in_nav: self._in_nav -= 1
        if tag in VOID: return
        if self.stack and self.stack[-1][0] == tag:
            self.stack.pop()
        else:
            self.errors.append(f"line {self.getpos()[0]}: unexpected </{tag}> (open: {self.stack[-1] if self.stack else None})")
            # recover
            for i in range(len(self.stack)-1, -1, -1):
                if self.stack[i][0] == tag:
                    del self.stack[i:]; break

pages = {}
SITE = os.path.normpath(os.path.abspath(SITE))
for root, _, files in os.walk(SITE):
    rel = os.path.relpath(root, SITE)
    if rel.split(os.sep)[0] in (".git", "scripts"): continue
    for f in files:
        if f.endswith(".html"):
            path = os.path.join(root, f)
            p = P(); p.feed(open(path, encoding="utf-8").read()); p.close()
            pages[os.path.relpath(path, SITE)] = p

problems, checked, external = [], 0, set()
for name, p in sorted(pages.items()):
    for e in p.errors: problems.append(f"{name}: {e}")
    for t, s in p.stack: problems.append(f"{name}: unclosed <{t}> from line {s}")
    for tag, attr, url, line in p.links:
        if tag == "link" and attr == "href" and url.startswith("https://ipcustodyinc.github.io/"):
            continue  # canonical URL (absolute by design)
        if name == "404.html" and url.startswith(BASE):
            url = url[len(BASE):] or "index.html"   # 404 uses absolute site URLs by design; check them as internal
        elif name == "404.html" and not re.match(r"^(https?:|mailto:|#)", url):
            problems.append(f"{name}:{line}: relative link in 404.html (must be absolute): {url}")
        sp = urlsplit(url)
        if sp.scheme in ("http", "https"):
            external.add(url); continue
        if sp.scheme in ("mailto", "tel"):
            if sp.scheme == "mailto" and not sp.path.lower().startswith("support@ipcustody.com"):
                problems.append(f"{name}:{line}: mailto to non-support address: {url}")
            continue
        if sp.scheme:
            problems.append(f"{name}:{line}: unexpected scheme {url}"); continue
        checked += 1
        if url.startswith("/"):
            problems.append(f"{name}:{line}: root-relative link (leading '/'): {url}"); continue
        target = name if sp.path == "" else os.path.normpath(os.path.join(os.path.dirname(name), unquote(sp.path)))
        if not os.path.exists(os.path.join(SITE, target)):
            problems.append(f"{name}:{line}: missing target {url}"); continue
        if sp.fragment:
            tp = pages.get(target)
            if tp is None or sp.fragment not in tp.ids:
                problems.append(f"{name}:{line}: missing #{sp.fragment} in {target}")

# Page-level checks: required pages, shared chrome, SEO tags
for req in REQUIRED_PAGES:
    if req not in pages: problems.append(f"missing required page: {req}")
for name, p in sorted(pages.items()):
    for k in ("description", "og:title", "og:description", "og:image", "og:url", "twitter:card", "viewport", "icon"):
        if not p.meta.get(k): problems.append(f"{name}: missing <meta>/<link> {k}")
    for t in ("header", "nav", "main", "footer"):
        if t not in p.tags: problems.append(f"{name}: missing <{t}>")
    navs = [u[len(BASE):] if u.startswith(BASE) else u for u in p.nav]
    for n in NAV_LINKS:
        if n not in navs: problems.append(f"{name}: nav missing link to {n}")
    if not any(u.startswith("mailto:support@ipcustody.com") for u in p.nav): problems.append(f"{name}: nav missing early-access mailto CTA")

# sitemap.xml + robots.txt
sm_path, rb_path = os.path.join(SITE, "sitemap.xml"), os.path.join(SITE, "robots.txt")
if not os.path.exists(sm_path): problems.append("missing sitemap.xml")
else:
    locs = re.findall(r"<loc>([^<]+)</loc>", open(sm_path, encoding="utf-8").read())
    for loc in locs:
        if not loc.startswith(BASE): problems.append(f"sitemap.xml: wrong base URL {loc}")
        elif not os.path.exists(os.path.join(SITE, loc[len(BASE):] or "index.html")): problems.append(f"sitemap.xml: no file for {loc}")
    listed = {(l[len(BASE):] or "index.html") for l in locs}
    for name in pages:
        if name != "404.html" and name not in listed: problems.append(f"sitemap.xml: page not listed: {name}")
if not os.path.exists(rb_path): problems.append("missing robots.txt")
elif f"Sitemap: {BASE}sitemap.xml" not in open(rb_path, encoding="utf-8").read(): problems.append("robots.txt: missing/incorrect Sitemap line")

print(f"Pages scanned: {len(pages)}  Internal links/assets checked: {checked}  External links (not fetched): {len(external)}")
for u in sorted(external): print("  external:", u)
if problems:
    print(f"PROBLEMS ({len(problems)}):"); [print("  " + x) for x in problems]; sys.exit(1)
print("RESULT: all internal links, assets and #fragments resolve; no root-relative links; tag nesting OK; "
      "every page has header/nav/main/footer, meta description, OG/Twitter tags and favicon; 404 uses absolute URLs; "
      "sitemap.xml and robots.txt OK.")
