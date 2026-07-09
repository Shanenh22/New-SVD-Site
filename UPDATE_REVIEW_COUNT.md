# How to Update the Google Review Count (takes 2 minutes)

Every review count and rating shown anywhere on the site — proof strips,
homepage stats, the reviews pages in both languages — reads from **one file**:

    data/reviews.json

## Quarterly update steps

1. Open your Google Business Profile and note the current review count and rating.
2. Edit `data/reviews.json` and change ONLY these two values in the
   `aggregate` block:

```json
{
  "aggregate": {
    "rating": "5.0",
    "count": 218,
    "source": "google",
    "lastChecked": "2026-07-09"
  }
}
```

3. Update `lastChecked` to today's date (for your own records).
4. Run the QA script and deploy:

```
python3 build.py
# if clean:
aws s3 sync . s3://YOUR-BUCKET --delete --exclude ".git/*"
```

That's it. Every page updates automatically — the numbers in the HTML are
just fallbacks for the moment before JavaScript loads.

## Do NOT
- Do not edit the numbers in any .html file (they're fallbacks; the JSON wins).
- Do not add review *text* from Google into the site's schema markup — Google
  treats self-published third-party review markup as a guidelines violation.
  Visible text quoting is also avoided by design; we link to Google instead,
  where reviews are verifiable.

## Why it works
`js/core.min.js` fetches `data/reviews.json` on every page and fills any
element carrying `data-review-count` or `data-review-rating`. The service
worker caches the JSON stale-while-revalidate, so updates appear on the
next visit after deploy.
