# IP Custody: marketing website (v1, draft)

Public marketing site for **IP Custody**: Day-0, blockchain-anchored proof of existence for intellectual property.

> **Status:** draft for owner review. The IP Custody service is **not live**. The site says so on every page, and all calls to action are "Join early access" email links (mailto:support@ipcustody.com with a prefilled subject and body). There are no forms that send data and no payments.

## What's here

Plain static HTML + CSS + a little vanilla JavaScript. There are no frameworks, no build step, no cookies, no analytics and no third-party scripts or fonts.

| File | Purpose |
|---|---|
| `index.html` | Home: hero, how it works, who it's for, what you get, layered-protection roadmap, CTA |
| `how-it-works.html` | Hashing, Merkle trees, OpenTimestamps/Bitcoin anchoring, evidence chain, links to the free tools |
| `prior-art.html` | **Free Prior Art Search launcher**: one query box, links that open the query on 26 public patent, literature, trademark, copyright, web-archive and code databases (client-side, `encodeURIComponent`), search tips, local search-log download, not-a-legal-opinion disclaimer |
| `proof-tool.html` | **Free Hash & Proof Tool**: local SHA-256 of a file or text (Web Crypto), self-generated JSON/TXT hash receipt (clearly NOT a blockchain timestamp or certificate), and a verify mode. No network requests |
| `features.html` | Full planned platform: custody model, prior art, monitoring, data rooms, certificates, API/CLI, Private Exchange, consultation/concierge, security & compliance roadmap, build roadmap |
| `pricing.html` | Early-access pricing: the six-tier ladder only (SEED $15, FORGE $30, ATLAS $60, SENTINEL $120, VAULT $240, SOVEREIGN $480) |
| `certificate.html` | Illustrative **SAMPLE** Certificate of Existence (placeholder hash/tx fields) and the specialized certificate versions |
| `compare.html` | IP Custody vs. provisional patent, copyright registration, trademark registration, and OriginStamp |
| `legal-validity.html` | FRE 901/902(13)/(14), the 2025 Marseille ruling, eIDAS, and other references, with limitations |
| `playbook.html` | The IP Protection Playbook |
| `toolkit.html` | List of Legal Toolkit templates, with a disclaimer (no template text) |
| `law-firms.html` | Law-firm partner licences ($199/$499/$999), law-firm packs, matching |
| `faq.html` | What a certificate proves and doesn't, plus common questions |
| `about.html`, `contact.html`, `legal.html`, `404.html` | Company, contact (support@ipcustody.com only), disclaimer + privacy notes, not-found page (uses absolute URLs so it works from any path) |
| `assets/style.css` | Shared styles (navy `#0A2540`, cyan `#00F5FF`, Inter/system font stack) |
| `assets/site.js` | Mobile nav toggle and footer year |
| `assets/prior-art.js` | Prior Art Search link builder and local search log |
| `assets/proof-tool.js` | Hash & Proof Tool (Web Crypto API; makes no network requests) |
| `assets/favicon.svg`, `assets/og-image.png` | Favicon and Open Graph image |
| `sitemap.xml`, `robots.txt` | Sitemap and robots file for `https://ipcustodyinc.github.io/ipcustody-site/` |
| `scripts/check_links.py` | Checks internal links, assets and `#fragments`, no root-relative links, tag nesting, shared header/nav/footer and SEO tags on every page, absolute URLs in 404.html, and sitemap/robots |
| `.nojekyll` | Tells GitHub Pages to serve files as-is |

The header, nav and footer are repeated in each HTML file. If you change them, update every page.

## Links

All internal links are **relative** (no leading `/`), so the site works at the GitHub Pages project path
`https://ipcustodyinc.github.io/ipcustody-site/`, in any subfolder, and locally.
Canonical and Open Graph URLs are absolute and point at that address. Update them if the site moves to a custom domain (e.g. ipcustody.com).

## Run locally

```bash
cd site
python3 -m http.server 8000
# open http://localhost:8000/
python3 scripts/check_links.py    # link check
```

The Hash & Proof Tool needs a secure context (`https://` or `localhost`) for the Web Crypto API.

## Hosting (GitHub Pages)

Planned host: **GitHub Pages** from the `main` branch root of the `ipcustody-site` repository in the `ipcustodyinc` account, at
`https://ipcustodyinc.github.io/ipcustody-site/`. In the repo, go to **Settings → Pages → Deploy from a branch → `main` / root**.
`404.html` is picked up automatically as the not-found page.

This repository currently has **no remote** and has not been pushed. Publishing waits for the owner's review.

## Contact

support@ipcustody.com
