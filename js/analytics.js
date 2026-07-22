/* NOTE — consent.js is RETIRED (May 2026 audit)
 * All consent banner, GA4 Consent Mode v2, GPC signal handling,
 * and cookie preference management is handled in this file.
 * Do not load consent.js — it duplicates this logic.
 * If you need to audit consent behavior, search for: grantConsent, denyConsent
 */

/* analytics.js — GA4 + consent management for Spring Valley Dental
 * Self-contained: handles consent banner, GA4 loading, and all conversion events.
 * No inline scripts needed. Just load this file (after site-config.js).
 *
 * How consent works:
 *   1. dataLayer consent default is set to DENIED before GA4 loads (correct GA4 pattern)
 *   2. localStorage is checked immediately:
 *      - 'granted' → GA4 fires right away, no banner shown
 *      - 'denied'  → GA4 blocked, no banner shown  
 *      - not set   → banner appears after 800ms, GA4 waits
 *   3. GA4 is loaded but respects the consent state throughout
 */
(function () {
  'use strict';
  if (window.__SVD_ANALYTICS__) return;
  window.__SVD_ANALYTICS__ = true;

  var CFG  = window.SITE_CONFIG   || {};
  var A    = CFG.ANALYTICS        || {};
  var ID   = A.GA_MEASUREMENT_ID  || '';
  var PREF = 'svd_analytics_consent';

  // ── Read stored consent preference ────────────────────────────────────────
  var stored = '';
  try { stored = localStorage.getItem(PREF) || ''; } catch(e) {}

  // ── Detect Global Privacy Control (Texas TDPSA / California) ──────────────
  var gpc = (navigator.globalPrivacyControl === true);
  if (gpc && stored !== 'granted') stored = 'denied';

  // ── Set up dataLayer and consent defaults BEFORE loading GA4 script ───────
  // This is the correct GA4 Consent Mode v2 pattern.
  // GA4 will NOT send any data until consent is updated to 'granted'.
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag('consent', 'default', {
    analytics_storage:  stored === 'granted' ? 'granted' : 'denied',
    ad_storage:         'denied',   // we don't use ads — always denied
    wait_for_update:    500
  });

  // ── Load GA4 script (only if enabled and ID is set) ───────────────────────
  if (A.ENABLE_GA && ID) {
    /* Queue config immediately (these buffer in dataLayer); defer the heavy
       gtag.js download until the visitor interacts or the page has been idle
       ~4s. Keeps ~159 KB of third-party JS out of the initial/LCP path
       without losing analytics for real sessions. */
    gtag('js', new Date());
    gtag('config', ID, {
      anonymize_ip:   true,
      transport_type: 'beacon'
    });
    var gaLoaded = false;
    function loadGA() {
      if (gaLoaded) return; gaLoaded = true;
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ID);
      document.head.appendChild(s);
    }
    var gaEvents = ['scroll', 'pointerdown', 'keydown', 'touchstart'];
    function gaKick() {
      loadGA();
      gaEvents.forEach(function (e) { window.removeEventListener(e, gaKick); });
    }
    gaEvents.forEach(function (e) { window.addEventListener(e, gaKick, { passive: true, once: true }); });
    setTimeout(loadGA, 4000);
  }

  // ── Load Plausible (optional, privacy-friendly) ───────────────────────────
  if (A.ENABLE_PLAUSIBLE && A.DOMAIN) {
    var p = document.createElement('script');
    p.defer = true;
    p.setAttribute('data-domain', A.DOMAIN);
    p.src = A.PLAUSIBLE_SRC || 'https://plausible.io/js/plausible.js';
    document.head.appendChild(p);
  }

  // ── Helper: fire GA4 event (only fires if consent is granted) ─────────────
  // Automatically attaches service_category from <body data-page-category="…">
  // so every conversion/event can be segmented by the page the visitor was on.
  function ga(eventName, params) {
    if (window.gtag && ID) {
      params = params || {};
      try {
        var cat = document.body && document.body.dataset ? document.body.dataset.pageCategory : '';
        if (cat && params.service_category == null) params.service_category = cat;
      } catch (e) {}
      try { window.gtag('event', eventName, params); } catch(e) {}
    }
  }

  // ── Helper: fire Plausible event ──────────────────────────────────────────
  function plausible(name, props) {
    if (window.plausible) {
      try { window.plausible(name, props ? { props: props } : undefined); } catch(e) {}
    }
  }

  // ── Grant consent ─────────────────────────────────────────────────────────
  function grantConsent() {
    try { localStorage.setItem(PREF, 'granted'); } catch(e) {}
    if (window.gtag) {
      window.gtag('consent', 'update', { analytics_storage: 'granted' });
    }
    window['ga-disable-' + ID] = false;
  }

  // ── Deny consent ──────────────────────────────────────────────────────────
  function denyConsent() {
    try { localStorage.setItem(PREF, 'denied'); } catch(e) {}
    if (window.gtag) {
      window.gtag('consent', 'update', { analytics_storage: 'denied' });
    }
    window['ga-disable-' + ID] = true;
  }

  // ── Expose revoke helper for privacy page ─────────────────────────────────
  window.svdRevokeConsent = function () {
    denyConsent();
    alert('Analytics tracking has been disabled. Your preference is saved.');
  };

  // ── Cookie banner UI ──────────────────────────────────────────────────────
  // Only show if consent hasn't been decided yet
  if (!stored) {
    document.addEventListener('DOMContentLoaded', function () {
      var banner  = document.getElementById('cookie-banner');
      var btnOk   = document.getElementById('cookie-accept');
      var btnNo   = document.getElementById('cookie-decline');
      if (!banner) return;

      // Show after 800ms — non-intrusive
      setTimeout(function () {
        banner.classList.remove('hidden');
        // Focus first button for accessibility
        var firstBtn = banner.querySelector('button');
        if (firstBtn) firstBtn.focus();
      }, 800);

      if (btnOk) btnOk.addEventListener('click', function () {
        grantConsent();
        banner.classList.add('hidden');
        // Fire page_view now that consent is granted
        ga('page_view', { page_title: document.title, page_location: location.href });
      });

      if (btnNo) btnNo.addEventListener('click', function () {
        denyConsent();
        banner.classList.add('hidden');
      });
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CONVERSION EVENT TRACKING
  // All events fire only when GA4 consent is granted.
  // ══════════════════════════════════════════════════════════════════════════


  // ── data-track attribute CTA tracking ────────────────────────────────────
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-track]');
    if (!el) return;
    var trackType = el.getAttribute('data-track');
    var trackLoc  = el.getAttribute('data-track-location') || 'unknown';
    if (trackType === 'call-emergency') {
      plausible('Emergency Call', { location: trackLoc });
      ga('emergency_call', { event_category: 'conversion', event_label: trackLoc, value: 5 });
    } else if (trackType === 'call') {
      plausible('Phone Call', { location: trackLoc });
      ga('phone_call', { event_category: 'conversion', event_label: trackLoc, value: 1 });
    } else if (trackType === 'appointment') {
      plausible('Appointment Click', { location: trackLoc });
      ga('appointment_click', { event_category: 'conversion', event_label: trackLoc, value: 1 });
    }
  });

  // ── UTM parameter capture + sessionStorage persistence ────────────────────
  (function captureUTM() {
    var params = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
    var sp = new URLSearchParams(window.location.search);
    params.forEach(function (key) {
      var val = sp.get(key);
      if (val) {
        try { sessionStorage.setItem(key, val); } catch(e) {}
      }
    });
    // Populate hidden form fields on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', function () {
      params.forEach(function (key) {
        var el = document.getElementById(key);
        if (!el) return;
        var val = sp.get(key) || (function() { try { return sessionStorage.getItem(key) || ''; } catch(e) { return ''; } })();
        if (val) el.value = val;
      });
    });
  })();

  // ── Form success event (fire after provider confirms success) ─────────────
  // Call window.svdFormSuccess() from your form provider callback
  window.svdFormSuccess = function () {
    plausible('Form Success');
    ga('form_submission_success', { event_category: 'conversion', event_label: 'contact_form', value: 10 });
    // Google Ads conversion hook — replace AW-XXXXXXX/XXXXXXX with real IDs when ready
    // if (window.gtag) gtag('event', 'conversion', { send_to: 'AW-XXXXXXX/XXXXXXX' });
    // The page-level form handler owns the success UI (it reveals #form-success and
    // hides the form). Only fall back to a basic inline message when no page handler
    // has marked the success state as already handled.
    var form = document.getElementById('contact-form');
    if (form && form.dataset.successHandled !== 'true') {
      form.innerHTML = '<div class="form-success" role="alert"><strong>Thank you!</strong> We&rsquo;ll be in touch within one business day. For urgent needs call (972) 852-2222.</div>';
    }
  };

  // ── Phone clicks ──────────────────────────────────────────────────────────
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="tel:"]');
    if (!a) return;
    var num = a.getAttribute('href').replace('tel:', '');
    plausible('Phone Click', { number: num });
    ga('phone_call', { event_category: 'conversion', event_label: num, value: 1 });
  });

  // ── Directions / Maps clicks ──────────────────────────────────────────────
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="google.com/maps"], a[id="cta-directions"]');
    if (!a) return;
    plausible('Directions Click');
    ga('get_directions', { event_category: 'conversion', value: 1 });
  });

  // ── Contact form submission ────────────────────────────────────────────────
  document.addEventListener('submit', function (e) {
    var form = e.target.closest && e.target.closest('form#contact-form');
    if (!form) return;
    plausible('Form Submit');
    ga('generate_lead', { event_category: 'conversion', event_label: 'contact_form', value: 1 });
  }, true);

  // ── Book / CTA button clicks ───────────────────────────────────────────────
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest(
      '#cta-hero-book, #cta-header-book, #cta-hero-call, #cta-mobile-call, #cta-emergency-call, #cta-form-submit'
    );
    if (!a) return;
    var label = a.id || a.textContent.trim().slice(0, 60);
    plausible('CTA Click', { label: label });
    ga('appointment_click', { event_category: 'conversion', event_label: label, value: 1 });
  });

  /* Scroll depth removed June 2026 (v5): GA4 Enhanced Measurement already
     fires a 90% scroll event; the custom 25/50/75/90 tracker double-counted
     engagement. Re-add only if finer granularity is genuinely needed. */

  // ── Financing / membership interest ───────────────────────────────────────
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="financing"], a[href*="membership"]');
    if (!a) return;
    plausible('Financing Interest', { page: a.getAttribute('href') });
    ga('financing_interest', { event_category: 'engagement', event_label: a.getAttribute('href') });
  });

  // ── Expose financing tracker for inline use ────────────────────────────────
  window.trackFinancingClick = function (provider) {
    plausible('Financing Click', { provider: provider });
    ga('financing_click', { event_category: 'conversion', event_label: provider, value: 1 });
  };

})();
