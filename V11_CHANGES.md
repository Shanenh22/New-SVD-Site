# SVD v11 — Change Summary

Built on the uploaded fixed ZIP. Final QA: **0 errors** (1 cosmetic warning: 3 unused sprite icons, harmless).

## 1. Google review system (site-wide)
- **One config line controls everything:** `js/site-config.js` → `REVIEW_URL`. Seeded with a working fallback (opens your Google listing by CID). **Replace it with your real write-review deep link** (`g.page/r/.../review` or `search.google.com/local/writereview?placeid=...`) so patients land directly in the star/text box.
- Wired site-wide via `js/core.js` (+ minified): any element with `data-review-link` gets the URL and fires GA4 (`review_click`) + Plausible tracking, tagged by location.
- **Placements added:**
  - EN reviews page buttons → now use the config + tracking
  - ES reviews page → new "Escribir una reseña en Google" button (matches EN)
  - Footer (EN + ES) → quiet "Leave a Google review" / "Dejar una reseña" link, site-wide
  - Thank-you page → soft existing-patient line (won't ask first-timers to review a visit they haven't had)
- **No sentiment gating** anywhere — compliant with Google + FTC rules.

## 2. QR kiosk page for staff
- `review-kiosk.html` — `noindex`, kiosk-styled, full-screen, faces the patient at checkout.
- `images/review-qr.png` — generated QR encoding the review URL. **Regenerate it if you change `REVIEW_URL`** (note is on the page).

## 3. Seven new Spanish pages
Built to the established ES template (head, schema, nav, footer, hreflang, breadcrumbs). FAQ schema included. Added to sitemap. EN twins' hreflang + language-toggle repointed to them (fixed two toggles that wrongly pointed to the implants page).

| New ES page | EN twin |
|---|---|
| es/diente-fracturado.html | cracked-tooth.html |
| es/coronas-y-puentes.html | crowns-bridges.html |
| es/resina-dental.html | dental-bonding.html |
| es/rellenos-dentales.html | dental-fillings.html |
| es/invisalign-vs-brackets-dallas.html | invisalign-vs-braces-dallas.html |
| es/guia-tratamiento-de-conducto.html | patient-guide-root-canal.html |
| es/galeria-de-sonrisas.html | smile-gallery.html |

**These need a native-speaker review before going live** — the translations are strong drafts, not a substitute for a clinician/native check of the medical phrasing.

## 4. Spanish title fixes
All 7 over-length ES titles rewritten under 60 characters (kept treatment term + Dallas + brand), og:titles synced. The 3 new pages that initially ran long were also trimmed.

## 5. Spanish uniformity audit
Ran a full consistency pass across all 41 ES pages. Fixed:
- es/symptom-navigator.html — added hreflang, og tags, and reciprocal EN tags (was missing all)
- es/privacidad.html — added missing og:image
- Repointed two EN language toggles that linked to the wrong ES page

## Still on you
1. **Paste your real Place ID / review deep link** into `REVIEW_URL` (one line).
2. **Native-speaker review** of the 7 new Spanish pages.
3. Optional: regenerate the QR after step 1 so it matches.
