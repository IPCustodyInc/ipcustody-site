# IP Custody: marketing website (v1, draft)

Public marketing site for **IP Custody**: Day-0, blockchain-anchored proof of existence for intellectual property.

> **Status:** draft for owner review. The IP Custody service is **not live**. The site says so on every page, and all calls to action are "Join early access" email links.

## What's here

Plain static HTML + CSS + a little vanilla JavaScript. There are no frameworks, no build step, no cookies, no analytics and no third-party scripts or fonts.

| File | Purpose |
|---|---|
| `index.html` | Home: hero, how it works, who it's for, what you get, layered-protection roadmap, CTA |
| `how-it-works.html` | Hashing, Merkle trees, OpenTimestamps/Bitcoin anchoring, evidence chain, and a **local-only "hash a file in your browser" demo** |
| `features.html` | Full planned platform: custody model, prior art, monitoring, data rooms, certificates, API/CLI, Private Exchange, consultation/concierge, security & compliance roadmap, build roadmap |
| `pricing.html` | Early-access pricing: six-tier ladder (SEED to SOVEREIGN) plus Starter/Pro plans, bundles, add-ons, and an earlier 5-tier outline |
| `certificate.html` | Illustrative **SAMPLE** Certificate of Existence (placeholder hash/tx fields) and the specialized certificate versions |
| `compare.html` | IP Custody vs. provisional patent, copyright registration, trademark registration, and OriginStamp |
| `legal-validity.html` | FRE 901/902(13)/(14), the 2025 Marseille ruling, eIDAS, and other references, with limitations |
| `playbook.html` | The IP Protection Playbook |
| `toolkit.html` | List of Legal Toolkit templates, with a disclaimer (no template text) |
| `law-firms.html` | Law-firm partner licences, bundles, matching |
| `faq.html` | What a certificate proves and doesn't, plus common questions |
| `about.html`, `contact.html`, `legal.html`, `404.html` | Company, contact (support@ipcustody.com only), disclaimer + "Terms/Privacy coming", not-found page |
| `assets/style.css` | Shared styles (navy `#0A2540`, cyan `#00F5FF`, Inter/system font stack) |
| `assets/site.js` | Mobile nav toggle and the in-browser SHA-256 demo (Web Crypto API; makes no network requests) |
| `assets/favicon.svg`, `assets/og-image.png` | Favicon and Open Graph image |
| `scripts/check_links.py` | Checks that internal links, assets and `#fragments` resolve, that no link is root-relative, and that tags nest correctly |
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

The hashing demo needs a secure context (`https://` or `localhost`) for the Web Crypto API.

## Hosting (GitHub Pages)

Planned host: **GitHub Pages** from the `main` branch root of the `ipcustody-site` repository in the `ipcustodyinc` account, at
`https://ipcustodyinc.github.io/ipcustody-site/`. In the repo, go to **Settings → Pages → Deploy from a branch → `main` / root**.
`404.html` is picked up automatically as the not-found page.

This repository currently has **no remote** and has not been pushed. Publishing waits for the owner's review.

## Contact

support@ipcustody.com
