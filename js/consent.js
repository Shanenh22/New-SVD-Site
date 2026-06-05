/* =============================================================================
   SPRING VALLEY DENTAL — consent.js
   Cookie / Privacy consent banner
   Compliant with: Texas TDPSA (eff. July 2024 / Jan 2025)
   Covers: GA4 analytics consent, GPC signal recognition, opt-out mechanism
   Small business exemption applies (no sale of sensitive data)
   but banner is implemented for patient trust + GA4 consent mode v2
   ============================================================================= */
(function () {
  'use strict';

  var CONSENT_KEY = 'svd_consent_v1';
  var GA_ID = 'G-KY64HPT0ER';

  // ── Check Global Privacy Control (GPC) signal — TDPSA §541.055 ──────────
  function hasGPC() {
    return navigator.globalPrivacyControl === true;
  }

  // ── Load stored preference ───────────────────────────────────────────────
  function getStored() {
    try { return JSON.parse(localStorage.getItem(CONSENT_KEY)); } catch(e) { return null; }
  }

  function setStored(val) {
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(val)); } catch(e) {}
  }

  // ── GA4 Consent Mode v2 ──────────────────────────────────────────────────
  function applyConsent(analytics) {
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage:       analytics ? 'granted' : 'denied',
        ad_storage:              'denied',
        ad_user_data:            'denied',
        ad_personalization:      'denied',
        functionality_storage:   'granted',
        security_storage:        'granted',
        personalization_storage: 'denied'
      });
    }
  }

  // ── Set default consent (denied until user chooses) ──────────────────────
  function setDefaultConsent() {
    if (window.gtag) {
      window.gtag('consent', 'default', {
        analytics_storage:       'denied',
        ad_storage:              'denied',
        ad_user_data:            'denied',
        ad_personalization:      'denied',
        functionality_storage:   'granted',
        security_storage:        'granted',
        wait_for_update:         500
      });
    }
  }

  // ── Dismiss banner ───────────────────────────────────────────────────────
  function dismiss(banner) {
    banner.setAttribute('aria-hidden', 'true');
    banner.style.transform = 'translateY(110%)';
    setTimeout(function () {
      if (banner.parentNode) banner.parentNode.removeChild(banner);
    }, 400);
  }

  // ── Accept analytics ─────────────────────────────────────────────────────
  function accept(banner) {
    setStored({ analytics: true, ts: Date.now() });
    applyConsent(true);
    dismiss(banner);
  }

  // ── Decline analytics ────────────────────────────────────────────────────
  function decline(banner) {
    setStored({ analytics: false, ts: Date.now() });
    applyConsent(false);
    dismiss(banner);
  }

  // ── Inject banner CSS ────────────────────────────────────────────────────
  function injectStyles() {
    var style = document.createElement('style');
    style.textContent = [
      '.svd-consent{',
        'position:fixed;bottom:0;left:0;right:0;z-index:9999;',
        'background:#fff;border-top:1px solid rgba(14,54,90,.12);',
        'box-shadow:0 -4px 32px rgba(14,54,90,.14);',
        'padding:16px 20px;',
        'display:flex;align-items:center;flex-wrap:wrap;gap:12px;',
        'font-family:-apple-system,BlinkMacSystemFont,"DM Sans",sans-serif;',
        'font-size:13.5px;color:#24313A;line-height:1.55;',
        'transition:transform .4s cubic-bezier(.4,0,.2,1);',
        'will-change:transform;',
      '}',
      '@media(max-width:640px){.svd-consent{flex-direction:column;align-items:stretch;padding:14px 16px}}',
      '.svd-consent-text{flex:1;min-width:200px}',
      '.svd-consent-text a{color:#0077B6;font-weight:500;text-underline-offset:2px}',
      '.svd-consent-actions{display:flex;gap:8px;flex-shrink:0;flex-wrap:wrap}',
      '@media(max-width:640px){.svd-consent-actions{flex-direction:column}}',
      '.svd-btn-accept{background:#C5640E;color:#fff;border:none;padding:9px 20px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;font-family:inherit;transition:background .18s}',
      '.svd-btn-accept:hover{background:#A3510B}',
      '.svd-btn-decline{background:transparent;color:#5A6D80;border:1.5px solid rgba(14,54,90,.2);padding:9px 20px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;white-space:nowrap;font-family:inherit;transition:all .18s}',
      '.svd-btn-decline:hover{border-color:#0077B6;color:#0E365A}',
      '.svd-consent-icon{font-size:18px;color:#0077B6;flex-shrink:0;align-self:flex-start;margin-top:1px}',
      '@media(max-width:640px){.svd-consent-icon{display:none}}',
    ].join('');
    document.head.appendChild(style);
  }

  // ── Build banner HTML ────────────────────────────────────────────────────
  function buildBanner(isEs) {
    var banner = document.createElement('div');
    banner.className = 'svd-consent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'false');
    banner.setAttribute('aria-label', isEs ? 'Aviso de privacidad y cookies' : 'Privacy and cookies notice');
    banner.setAttribute('aria-live', 'polite');

    var privacyHref = (isEs ? '../' : '') + 'privacy.html';

    if (isEs) {
      banner.innerHTML = [
        '<i class="ti ti-shield-check svd-consent-icon" aria-hidden="true"></i>',
        '<div class="svd-consent-text">',
          '<strong>Su privacidad importa.</strong> Usamos Google Analytics para entender c\u00f3mo se usa nuestro sitio. ',
          'No compartimos su informaci\u00f3n con terceros ni la vendemos. Puede rechazar el an\u00e1lisis sin afectar su navegaci\u00f3n. ',
          '<a href="' + privacyHref + '">Ver pol\u00edtica de privacidad</a>',
        '</div>',
        '<div class="svd-consent-actions">',
          '<button class="svd-btn-accept" id="svd-accept">Aceptar</button>',
          '<button class="svd-btn-decline" id="svd-decline">Rechazar an\u00e1lisis</button>',
        '</div>'
      ].join('');
    } else {
      banner.innerHTML = [
        '<i class="ti ti-shield-check svd-consent-icon" aria-hidden="true"></i>',
        '<div class="svd-consent-text">',
          '<strong>Your privacy matters.</strong> We use Google Analytics to understand how visitors use our site. ',
          'We do not sell or share your information. You can decline analytics without affecting your experience. ',
          '<a href="' + privacyHref + '">Privacy policy</a>',
        '</div>',
        '<div class="svd-consent-actions">',
          '<button class="svd-btn-accept" id="svd-accept">Accept analytics</button>',
          '<button class="svd-btn-decline" id="svd-decline">Decline</button>',
        '</div>'
      ].join('');
    }

    return banner;
  }

  // ── Main init ────────────────────────────────────────────────────────────
  function init() {
    // Set default consent immediately (GA4 consent mode v2)
    setDefaultConsent();

    // If GPC signal is active, automatically deny and don't show banner
    if (hasGPC()) {
      setStored({ analytics: false, ts: Date.now(), gpc: true });
      applyConsent(false);
      return;
    }

    // Check stored preference
    var stored = getStored();
    if (stored && typeof stored.analytics === 'boolean') {
      // Preference already recorded — apply silently
      applyConsent(stored.analytics);
      return;
    }

    // No preference yet — show banner
    injectStyles();
    var isEs = (window.location.pathname.indexOf('/es/') !== -1);
    var banner = buildBanner(isEs);

    // Animate in after DOM is ready
    banner.style.transform = 'translateY(110%)';
    document.body.appendChild(banner);
    setTimeout(function () { banner.style.transform = 'translateY(0)'; }, 80);

    // Button handlers
    var acceptBtn = document.getElementById('svd-accept');
    var declineBtn = document.getElementById('svd-decline');
    if (acceptBtn) acceptBtn.addEventListener('click', function () { accept(banner); });
    if (declineBtn) declineBtn.addEventListener('click', function () { decline(banner); });

    // Keyboard: Escape = decline (not dark pattern — just convenience)
    document.addEventListener('keydown', function handler(e) {
      if (e.key === 'Escape' && document.body.contains(banner)) {
        decline(banner);
        document.removeEventListener('keydown', handler);
      }
    });

    // Focus first button after animation
    setTimeout(function () {
      if (acceptBtn) acceptBtn.focus();
    }, 200);
  }

  // ── Expose opt-out helper for privacy page ───────────────────────────────
  window.SVD_revokeConsent = function () {
    setStored({ analytics: false, ts: Date.now() });
    applyConsent(false);
    alert('Analytics consent has been withdrawn. Your preference has been saved.');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
