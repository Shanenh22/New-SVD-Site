/* Site-wide configuration for endpoints and feature toggles.
   Edit this file to configure analytics, API endpoints, and optional features.
*/
window.SITE_CONFIG = {
  /* Contact form API endpoint (AWS API Gateway + Lambda + SES).
     Replace with your actual API Gateway URL once deployed. */
  CONTACT_API_URL: ""  /* Contact form currently uses Web3Forms (see contact.html action attr). Set this if switching to a custom backend. */,

  /* ============================================================
     GOOGLE REVIEW LINK  —  one source of truth for all review CTAs
     ------------------------------------------------------------
     Direct "write a review" deep link built from the practice Place ID.
     Opens the Google star/text box directly (not the listing).
     Place ID: ChIJJxpAIykhTIYRfFDapveAaOQ
     If you ever need to rebuild it:
       https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID
     After changing this, regenerate images/review-qr.png to match.
     ============================================================ */
  REVIEW_URL: "https://search.google.com/local/writereview?placeid=ChIJJxpAIykhTIYRfFDapveAaOQ",

  /* Cloudflare Turnstile (CAPTCHA alternative).
     Set ENABLE_TURNSTILE: true and add your site key to activate. */
  ENABLE_TURNSTILE: false,
  TURNSTILE_SITE_KEY: "",

  ANALYTICS: {
    /* Plausible — privacy-friendly, no cookies required */
    ENABLE_PLAUSIBLE: false, /* Disabled — GA4 is the primary analytics platform. Re-enable if switching away from GA4. */
    DOMAIN: "springvalleydentistry.com",
    // Uncomment to use self-hosted Plausible:
    // PLAUSIBLE_SRC: "https://analytics.example.com/js/plausible.js",

    /* Google Analytics 4 — set ENABLE_GA: true and add Measurement ID */
    ENABLE_GA: true,
    GA_MEASUREMENT_ID: "G-KY64HPT0ER"
  }
};

/* Service Worker registration */
if ('serviceWorker' in navigator) {
  /* If a previously-installed SW is replaced by a new version, reload once so
     the page picks up the fresh CSS/JS instead of stale cached copies. Only
     reloads when REPLACING an existing controller (never on first install),
     and guards against reload loops. */
  var hadController = !!navigator.serviceWorker.controller;
  var reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (hadController && !reloading) {
      reloading = true;
      window.location.reload();
    }
  });
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(function (reg) {
        /* Proactively check for an updated SW on each load. */
        if (reg && reg.update) { try { reg.update(); } catch (e) {} }
      })
      .catch(function (err) { console.warn('SW registration failed:', err); });
  });
}
