# Spring Valley Dental — Fresh Site Audit

Audited as a first look: 45 English + 34 Spanish pages, static HTML, fully bilingual, with service pages, five city landing pages, a symptom-navigator tool, membership and financing pages, and a smile gallery.

## Bottom line up front

This is a well-built site, above the bar for a local dental practice. The technical SEO foundation, schema depth, bilingual coverage, and copywriting are already strong. The biggest gains left are **not** in fixing broken things — they're in (1) the booking mechanism, (2) review/rating signals, and (3) consistency of a few E-E-A-T elements that are present on some pages but not others. If I only had time for three things, those are the three.

What follows separates what I verified (fact), what I'm inferring, and what I'd actually do.

---

## What's already strong (don't touch)

These are verified and genuinely good, so they're off the table:

- **Schema depth.** Homepage carries WebSite, Dentist (full NAP, hours, geo, areaServed, employee credentials), FAQPage, BreadcrumbList, and WebPage-with-speakable. FAQ schema is on 33 pages. This is more thorough than most practices ever implement.
- **Bilingual architecture.** 34 ES pages with correct hreflang reciprocity, unique translated content, dedicated ES contact form. Real localization, not machine-translated stubs.
- **City landing pages.** Five `dentist-[city]-tx` pages, ~1,500 words each, verified *not* near-duplicates. This is the correct way to do local geo pages; most practices build thin doorway pages and get filtered.
- **Asset performance.** ~2.8MB total image payload, AVIF/WebP responsive hero with `fetchpriority="high"` preload, 90KB minified CSS, minified JS. LCP setup is correct.
- **AEO/GEO layer.** `llms.txt` (185 lines), AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot) explicitly addressed in robots.txt, answer-first FAQ formatting.
- **Copy.** Distinctive, human voice ("Dentists who actually listen," "We don't ask why you stayed away, and we don't lecture"). This is a real competitive asset and rare in the category.

---

## The real opportunities, in priority order

### 1. "Book Online" doesn't book — it's a contact form [Certain]
**Fact:** Every "Book Online" CTA across the site resolves to `contact.html`, which is a Web3Forms submission form (name, email, phone, insurance, patient type, preferred time, service, message — 5 required fields). There is no real-time scheduling integration (no NexHealth, LocalMed, Zocdoc, or similar).

**Why it matters:** "Book Online" sets an expectation of seeing open slots and confirming instantly. What the patient gets is a contact form and a wait for a callback. That gap costs conversions, especially for the emergency/anxious-patient segments this site is explicitly built around — a person in pain at 9pm wants a slot, not a "we'll get back to you."

**Judgment:** Two honest options, and which one depends on operational reality I can't see:
- If the practice *can* support real-time scheduling, integrating a scheduler (NexHealth/LocalMed/Dentrix Online Booking) behind the existing "Book Online" buttons is the single highest-conversion change available.
- If the front desk prefers to control the schedule by phone (common and legitimate for a relationship-driven practice), then **rename the CTAs** to "Request an Appointment" so the button matches reality. Mismatched expectations convert worse than honest ones.

[Guessing] I'd bet the practice is phone-first given the "just call, we'll handle the rest" copy. If so, the rename is a 30-minute change with real upside. The integration is the bigger play if operations can support it.

### 2. No aggregateRating schema anywhere [Certain]
**Fact:** There is no `aggregateRating` / `reviewCount` / `ratingValue` markup on any page, including the homepage and `reviews.html`. The site links to Google reviews but doesn't mark up a rating.

**Why it matters:** Star ratings in search results are one of the strongest CTR levers a local business has. Without the markup, the listing shows plain.

**Important caveat [Likely]:** Google specifically restricts self-serving review markup for LocalBusiness/Dentist — markup of reviews collected on your *own* site can trigger a manual action, and Google won't show stars sourced from your own first-party claims for local-business types. So the right move is narrower than "add aggregateRating to the Dentist schema":
- Markup reviews only where they're legitimately first-party and policy-compliant (e.g., genuine testimonials with author and date you collected directly), and
- Lean on the Google Business Profile for the star display in Maps/local pack, where the real review velocity lives.

**Judgment:** Don't bolt a fake or Google-sourced rating into the Dentist schema; that's a risk, not a win. Do add properly-attributed `Review` items (author, datePublished, reviewBody) on `reviews.html` for the testimonials you own. Tell me whether the testimonials on that page are real, attributed, and collected first-party, and I'll mark them up correctly.

### 3. Medical-review bylines are inconsistent [Certain]
**Fact:** Some pages carry a "Reviewed by Dr. Nicole Houshmand, DDS · June 2026" byline (e.g., cracked-tooth.html, toothache.html, the cost pages). The 16 core clinical service pages (dental-implants, root-canal-therapy, gum-disease-treatment, etc.) do **not**.

**Why it matters:** For YMYL (your-money-your-life) medical content, a visible clinician review byline is a direct E-E-A-T signal to Google and a trust signal to patients. The site already has the pattern built — it's just applied unevenly.

**Judgment:** Roll the existing byline component onto every clinical service page, linked to the relevant doctor's bio anchor. This is low-effort, high-consistency, and you already have the exact markup to copy. I can do this across all service pages in one pass — say the word and confirm which doctor should be credited as reviewer for which service (or default to Dr. Houshmand for all).

### 4. Seven Spanish titles exceed 60 characters [Certain]
**Fact:** `es/ansiedad-dental` (84), `es/dolor-de-muelas` (83), `es/costo-implantes-dentales-dallas` (80), `es/costos-dentales-dallas` (79), `es/tratamiento-de-encias` (75), `es/tratamiento-de-conducto` (72), `es/symptom-navigator` (64).

**Why it matters:** Google truncates these in results, cutting the call-to-action or location term off the visible title. Spanish phrasing runs longer than English, so this needs deliberate trimming, not mechanical cropping.

**Judgment:** This is a keyword-priority decision, not a bug. For each, decide what must stay visible — usually the treatment term + "Dallas." I can rewrite all seven to land under 60 while keeping the primary keyword and city if you tell me the priority. It's a content call, which is why I'm flagging rather than guessing.

### 5. Seven English pages have no Spanish translation [Likely material]
**Fact:** cracked-tooth, crowns-bridges, dental-bonding, dental-fillings, invisalign-vs-braces-dallas, patient-guide-root-canal, smile-gallery exist in English only.

**Why it matters:** Given the practice's explicit bilingual positioning and a Spanish-speaking North Dallas market, these are gaps in an otherwise complete ES mirror. A Spanish speaker researching fillings or crowns hits English.

**Judgment:** This is translation work, not code, and medical copy needs human review — I won't auto-generate it. Worth prioritizing by search demand: crowns-bridges and dental-fillings are high-volume bread-and-butter topics; the others are lower priority. If you want, I can draft Spanish translations for the two highest-value ones for your review.

---

## Smaller items worth noting

- **Form field count [Likely].** The contact form requires 5 fields (first name, last name, phone, email, service). For an emergency or in-pain patient, email-as-required adds friction. Consider making email optional and phone the only required contact method on the emergency path. Privacy/HIPAA language and a privacy-policy link are already present near the form — that part's done right.
- **Two contact-form JS files [Certain].** `contact-form.js` and `contacto-form.js` both ship. Confirm both are needed (EN/ES split) and neither is dead weight.
- **No visible rating in the hero proof [Judgment].** The hero shows practice highlights but not a "4.9 ★ on Google" style proof point. If the Google rating is strong, surfacing the number (sourced honestly from GBP, displayed as text, not schema) is a cheap trust boost.

---

## What I'd do, in order

1. **Decide the booking question.** Either integrate a real scheduler behind "Book Online," or rename the CTAs to "Request an Appointment." Highest-leverage item on the site. (Your operational call; I can execute the rename immediately.)
2. **Apply the review byline to all 16 clinical service pages.** Low effort, you already have the component. I can do this now.
3. **Add properly-attributed Review markup to reviews.html** for first-party testimonials — *not* a blanket aggregateRating on the Dentist schema. I'll need you to confirm the testimonials are real and first-party.
4. **Rewrite the 7 long ES titles** under 60 chars, keeping treatment + city. Tell me the keyword priority and I'll do all seven.
5. **Translate the 2 highest-value missing ES pages** (crowns-bridges, dental-fillings) — I can draft, you review the medical accuracy.

Items 2 and 4 I can apply and re-verify in this session. Items 1, 3, and 5 need a decision or confirmation from you first. Which do you want to start with?
