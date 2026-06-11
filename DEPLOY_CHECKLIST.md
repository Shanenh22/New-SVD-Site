# v5 — June 2026 audit implementation (prepend; older checklist below)

## What changed in this release
- **Icons**: Tabler CDN webfont removed site-wide. Icons now served from
  /images/icons-sprite.svg (self-hosted, 81 symbols). Fixed 3 icons that were
  silently rendering blank on v4 (ti-tooth / ti-implant / ti-injection never
  existed in the Tabler font).
- **Hero LCP**: slide 1 is now a responsive <img> (640/960/1408w). Slides 2–4
  remain CSS backgrounds, preloaded only after window load by js/hero-carousel.js.
- **New JS files** (precached by SW): hero-carousel.js, contact-form.js,
  page-extras.js. No inline <script> blocks remain on index/contact/gallery (CSP prep).
- **Schema**: aggregateRating + third-party review markup removed everywhere
  (Google self-serving review policy); duplicate Dentist entities merged.
- **hreflang**: corrected on ~25 pages; 5 new EN↔ES pairs added.
- **New pages (6)**: dental-cleanings-exams.html, es/carillas-de-porcelana.html,
  es/blanqueamiento-dental.html, es/financiamiento.html, es/plan-de-membresia.html,
  es/limpieza-dental.html — all in sitemap.xml and llms.txt.
- **City pages (10)**: differentiated with unique directions + city FAQs (visible + schema).
- **Review count single source**: every visible count/rating carries
  data-review-count / data-review-rating and syncs from data/reviews.json.
  → To update the review number: edit data/reviews.json aggregate block ONLY.
- **SW**: CACHE_VERSION bumped to svd-v5; new assets precached.
- robots.txt rewritten (phantom paths removed); 404.html noindexed.

## Deploy steps (additions)
1. Upload the whole bundle (deleted ~20 unused images — sync with --delete).
2. Apply deploy-config/cloudfront-response-headers-policy.json (security headers; CSP report-only).
3. Apply deploy-config/redirect-informacion-paciente.md (real 301 + verify 404 status code).
4. After deploy: PageSpeed/CrUX check (expect LCP improvement, esp. mobile),
   GA4 DebugView consent-flow re-test, Search Console: resubmit sitemap.
5. OPEN ITEM (unchanged): resolve Web3Forms BAA or migrate the form to
   API Gateway + SES per the stub in js/site-config.js.

---

# Spring Valley Dental — Deployment Checklist

Run this before every deployment. Takes < 10 minutes.

## Pre-Deploy Checks

### Analytics
- [ ] Open site-config.js — confirm GA_MEASUREMENT_ID is correct (G-KY64HPT0ER)
- [ ] Confirm ENABLE_GA: true
- [ ] Test GA4 fires: open site in Chrome, go to GA4 DebugView, load homepage, confirm page_view event appears

### Schema / SEO
- [ ] Run homepage through Google's Rich Results Test (search.google.com/test/rich-results)
- [ ] Run emergency.html and all three geo pages through the same tool
- [ ] Check sitemap.xml includes all current pages
- [ ] Confirm review count in schema (aggregateRating.reviewCount) matches current Google Business Profile count

### Links
- [ ] Run broken-link-checker: `npx broken-link-checker http://localhost:PORT --recursive`
- [ ] Confirm /informacion-paciente.html redirects to /es/informacion-paciente.html
- [ ] Confirm all nav links resolve on index.html

### Images
- [ ] No PNG files in /images/ except favicon/icon files (all treatment images should be .webp)
- [ ] Hero images under 200 KB each (check with: `ls -lh images/hero-*.webp`)
- [ ] Service images under 80 KB each

### Compliance
- [ ] Contact form PHI warning visible on contact.html
- [ ] Emergency 911 disclaimer visible on emergency.html
- [ ] "Individual results vary" visible on porcelain-veneers, teeth-whitening, invisalign, dental-bonding
- [ ] "Long-term function with proper care" language (not "lifetime") on implant pages

### Content
- [ ] Review count (214 or current) matches Google Business Profile — update if needed:
  - index.html schema (aggregateRating.reviewCount)
  - index.html visible: "214 five-star reviews" heading and proof bar
  - reviews.html if hardcoded

### Forms
- [ ] Submit a test message on contact.html — confirm you receive it
- [ ] Confirm PHI warning is above the message field

## Post-Deploy Checks
- [ ] Load homepage on mobile (iPhone-sized) — confirm no layout breaks
- [ ] Confirm cookie banner appears and both Accept/Decline work
- [ ] Confirm mobile bottom bar shows Call, Book, Directions
- [ ] Test emergency.html on mobile — 911 disclaimer visible, call CTA prominent
- [ ] Check Google Search Console for crawl errors within 48 hours

## Quarterly (not every deploy)
- [ ] Update review count from Google Business Profile
- [ ] Refresh any seasonal offers or messaging
- [ ] Check GA4 for top landing pages — confirm no unexpected 404s in behavior flow
- [ ] Confirm Web3Forms is still operational and review BAA status

## Service worker (IMPORTANT on every release)

The site uses a service worker (`sw.js`) for offline support and faster repeat
visits. To avoid visitors getting stale CSS/JS after you publish changes:

1. **Bump `CACHE_VERSION`** in `sw.js` (e.g. `svd-v2` -> `svd-v3`) whenever you
   change any CSS, JS, or precached asset. This purges old caches on activate.
2. Assets use a stale-while-revalidate strategy, so a returning visitor gets the
   updated files automatically on their next load; `site-config.js` reloads the
   page once when a new worker takes over.
3. If a browser ever seems stuck on old files, in DevTools open
   Application > Service Workers > Unregister, then hard-reload (Shift+Reload).
