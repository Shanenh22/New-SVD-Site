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
