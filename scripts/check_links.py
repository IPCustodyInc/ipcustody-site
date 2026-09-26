#!/usr/bin/env python3
"""Check that every internal link/asset in the site resolves (files + #fragments),
that no internal link starts with '/', and that basic tag nesting is balanced."""
import os, sys, re
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote

SITE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
VOID = {"area","base","br","col","embed","hr","img","input","link","meta","source","track","wbr","path","rect","circle"}

class P(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links, self.ids, self.stack, self.errors = [], set(), [], []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
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
for root, _, files in os.walk(SITE):
    if "/.git" in root or "/scripts" in root: continue
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

print(f"Pages scanned: {len(pages)}  Internal links/assets checked: {checked}  External links (not fetched): {len(external)}")
for u in sorted(external): print("  external:", u)
if problems:
    print(f"PROBLEMS ({len(problems)}):"); [print("  " + x) for x in problems]; sys.exit(1)
print("RESULT: all internal links, assets and #fragments resolve; no root-relative links; tag nesting OK.")
