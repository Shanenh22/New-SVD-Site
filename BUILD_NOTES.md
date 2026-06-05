# SVD Site — Build Notes & Template Migration

## Current State
This is a flat-file static HTML site (41 pages). Global elements — nav, footer, 
mobile bar, cookie banner — are duplicated across all files. Any change to these
elements requires editing all 41 pages.

## Recommended Migration: Eleventy (11ty)

Eleventy is a zero-config static site generator that supports HTML, Liquid, 
Nunjucks, and Markdown templates. Migration path:

### Step 1 — Install
```bash
npm install -g @11ty/eleventy
```

### Step 2 — Create _includes/ partials
Extract these repeated blocks into _includes/:
- _includes/head.njk       → <head> meta, fonts, scripts
- _includes/nav.njk        → site navigation + mobile drawer
- _includes/footer.njk     → footer with columns, hours, legal
- _includes/mobile-bar.njk → bottom sticky action bar
- _includes/cookie.njk     → cookie banner + inline consent script
- _includes/schema.njk     → base Dentist JSON-LD

### Step 3 — Create _data/site.json
Single source of truth for global config:
```json
{
  "name": "Spring Valley Dental Associates",
  "phone": "(972) 852-2222",
  "address": "14228 Midway Rd, Suite 100, Dallas, TX 75244",
  "email": "info@springvalleydentistry.com",
  "ga_id": "G-KY64HPT0ER",
  "review_count": 214,
  "review_rating": 5.0,
  "hours": {
    "Monday": "10:00 AM - 7:00 PM",
    "Tuesday": "8:30 AM - 4:00 PM",
    "Wednesday": "10:00 AM - 7:00 PM",
    "Thursday": "Closed",
    "Friday": "8:00 AM - 3:00 PM"
  }
}
```

### Step 4 — Convert pages to templates
Replace duplicated head/nav/footer in each .html with include tags:
```html
{% include "head.njk" %}
{% include "nav.njk" %}
<main>
  <!-- page-specific content here -->
</main>
{% include "footer.njk" %}
{% include "cookie.njk" %}
```

### Step 5 — Build
```bash
npx eleventy
```
Output goes to _site/ — deploy that directory.

## Until Migration
Use find/replace or the DEPLOY_CHECKLIST.md to manage global changes manually.
When updating nav, footer, or mobile bar: use a text editor's Find in Files 
(VS Code: Ctrl+Shift+H) to update all 41 pages at once.

## CSS Maintenance
- Do NOT add inline styles to HTML pages — add classes to css/styles.css
- The CSS file is 2876 lines. When adding new components, append at the bottom
  under the "AUDIT FIXES 2026" section
- Before deploy, consider running PurgeCSS to remove unused rules
