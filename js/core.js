/* =============================================================================
   SPRING VALLEY DENTAL — core.js
   Nav scroll-hide · mobile drawer · FAQ accordion · live hours ·
   scroll reveal · stats counter · Saturday tooltip
   S3/CloudFront static · no external dependencies
   ============================================================================= */
(function () {
  'use strict';

  /* ── HOURS CONFIG ───────────────────────────────────────────────────────── */
  var HOURS = window.SVD_HOURS = {
    0: { label: 'Sunday',    open: null,  close: null  }, // closed
    1: { label: 'Monday',    open: 600,   close: 1140  }, // 10am–7pm
    2: { label: 'Tuesday',   open: 510,   close: 960   }, // 8:30am–4pm
    3: { label: 'Wednesday', open: 600,   close: 1140  }, // 10am–7pm
    4: { label: 'Thursday',  open: null,  close: null  }, // closed
    5: { label: 'Friday',    open: 480,   close: 900   }, // 8am–3pm
    6: { label: 'Saturday',  open: null,  close: null,
         note: 'First Saturday of each month by appointment only. Call (972) 852-2222 to schedule.' }
  };

  function isOpen(day) {
    var h = HOURS[day];
    if (!h || h.open === null) return false;
    var now = new Date();
    var tm  = now.getHours() * 60 + now.getMinutes();
    return tm >= h.open && tm < h.close;
  }

  /* ── SCROLL-AWARE NAV ───────────────────────────────────────────────────── */
  function initNav() {
    var nav     = document.getElementById('site-nav');
    if (!nav) return;
    var lastY   = window.scrollY;
    var ticking = false;

    function tick() {
      var y = window.scrollY;
      if (y > lastY && y > 80) {
        nav.classList.add('nav-hidden');
      } else {
        nav.classList.remove('nav-hidden');
      }
      nav.classList.toggle('nav-scrolled', y > 30);
      lastY = y;
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(tick); ticking = true; }
    }, { passive: true });
  }

  /* ── MOBILE DRAWER ──────────────────────────────────────────────────────── */
  function initDrawer() {
    var burger  = document.getElementById('hamburger');
    var drawer  = document.getElementById('mobile-drawer');
    var overlay = document.getElementById('drawer-overlay');
    var closeBtn = document.getElementById('drawer-close');
    if (!burger || !drawer || !overlay) return;

    function open() {
      drawer.hidden = false;
      requestAnimationFrame(function () {
        drawer.classList.add('open');
        overlay.classList.add('open');
      });
      burger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      if (closeBtn) setTimeout(function () { closeBtn.focus(); }, 50);
    }

    function close() {
      drawer.classList.remove('open');
      overlay.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      setTimeout(function () { drawer.hidden = true; }, 320);
      burger.focus();
    }

    burger.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('open')) close();
    });

    // close on nav link click
    drawer.querySelectorAll('.drawer-nav-link, .drawer-quick-btn').forEach(function (a) {
      a.addEventListener('click', close);
    });
  }

  /* ── FAQ ACCORDION ──────────────────────────────────────────────────────── */

  /* ── FOCUS TRAP inside mobile drawer (WCAG 2.1 SC 2.1.2) ────────────── */
  function trapFocus(drawer) {
    var focusable = drawer.querySelectorAll(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    var first = focusable[0];
    var last  = focusable[focusable.length - 1];
    drawer.addEventListener('keydown', function(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    });
  }

  function initFAQ() {
    document.querySelectorAll('.faq-item').forEach(function (item, idx) {
      var btn    = item.querySelector('.faq-btn');
      var answer = item.querySelector('.faq-answer');
      if (!btn || !answer) return;

      /* Stable index-based ID so aria-labelledby is consistent across loads */
      var btnId = 'faq-btn-' + idx;
      btn.setAttribute('id', btnId);
      answer.setAttribute('aria-labelledby', btnId);

      btn.addEventListener('click', function () {
        var isExpanded = btn.getAttribute('aria-expanded') === 'true';

        // close all others in same list
        var list = item.closest('.faq-list');
        if (list) {
          list.querySelectorAll('.faq-item.open').forEach(function (openItem) {
            if (openItem !== item) {
              var ob  = openItem.querySelector('.faq-btn');
              var oa  = openItem.querySelector('.faq-answer');
              if (ob) ob.setAttribute('aria-expanded', 'false');
              if (oa) { oa.style.maxHeight = '0'; oa.classList.remove('open'); }
              openItem.classList.remove('open');
            }
          });
        }

        if (isExpanded) {
          btn.setAttribute('aria-expanded', 'false');
          answer.style.maxHeight = '0';
          answer.classList.remove('open');
          item.classList.remove('open');
        } else {
          btn.setAttribute('aria-expanded', 'true');
          answer.style.maxHeight = answer.scrollHeight + 'px';
          answer.classList.add('open');
          item.classList.add('open');
        }
      });
    });
  }

  /* ── LIVE HOURS HIGHLIGHT ───────────────────────────────────────────────── */
  function applyHours(containerId, rowSel, daySel) {
    var container = document.getElementById(containerId);
    if (!container) return;
    var today = new Date().getDay();
    var h     = HOURS[today] || {};
    var open  = isOpen(today);
    var byAppt = (h.open === null && !!h.note); // appointment-only day (e.g. Saturday)

    container.querySelectorAll(rowSel).forEach(function (row) {
      var d = parseInt(row.getAttribute('data-day'), 10);
      if (d !== today) return;
      row.classList.add('today');
      var dayEl = row.querySelector(daySel);
      if (!dayEl) return;

      var pill = document.createElement('span');
      if (open) {
        pill.className = 'live-pill';
        pill.textContent = 'Open now';
        pill.setAttribute('aria-label', 'Currently open');
      } else if (byAppt) {
        pill.className = 'live-pill appt';
        pill.textContent = 'By appt';
        pill.setAttribute('aria-label', 'Open by appointment today');
        if (h.note) pill.setAttribute('title', h.note);
      } else {
        pill.className = 'live-pill closed';
        pill.textContent = 'Closed';
        pill.setAttribute('aria-label', 'Currently closed');
      }
      dayEl.appendChild(pill);
    });
  }

  function initHours() {
    applyHours('loc-hours',    '.hr-row', '.hday');
    applyHours('footer-hours', '.fhr',    '.fhd');
    applyHours('drawer-hours', '.dhr',    '.dd');
    // Saturday tooltip trigger for keyboard
    document.querySelectorAll('.sat-info').forEach(function (el) {
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', 'Saturday hours details');
    });
  }

  /* ── SCROLL REVEAL ──────────────────────────────────────────────────────── */
  function initReveal() {
    if (!window.IntersectionObserver) {
      // fallback — show everything
      document.querySelectorAll('.reveal').forEach(function (el) {
        el.classList.add('in');
      });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -36px 0px' });

    document.querySelectorAll('.reveal').forEach(function (el) {
      obs.observe(el);
    });
  }


  /* ── GALLERY FILTER ─────────────────────────────────────────────────────── */
  function initGalleryFilter() {
    var btns  = document.querySelectorAll('.gf-btn');
    var items = document.querySelectorAll('.gallery-item');
    if (!btns.length) return;

    // Set initial aria-pressed state
    btns.forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.classList.contains('active') ? 'true' : 'false');
    });

    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        btns.forEach(function (b) {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        var filter = btn.getAttribute('data-filter');
        items.forEach(function (item) {
          if (filter === 'all' || item.getAttribute('data-category') === filter) {
            item.style.display = '';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });

    // Deep-link support: /smile-gallery.html#veneers auto-applies that filter.
    function applyHashFilter() {
      var key = (location.hash || '').replace('#', '').toLowerCase();
      if (!key) return;
      var match = Array.prototype.filter.call(btns, function (b) {
        return b.getAttribute('data-filter') === key;
      })[0];
      if (match) {
        match.click();
        match.focus();
      }
    }
    applyHashFilter();
    window.addEventListener('hashchange', applyHashFilter);
  }

  /* ── FOOTER YEAR ────────────────────────────────────────────────────────── */

  /* ── LAZY GOOGLE MAPS ────────────────────────────────────────────────── */
  function initLazyMaps() {
    if (!window.IntersectionObserver) {
      document.querySelectorAll('iframe[data-src]').forEach(function(iframe) {
        iframe.src = iframe.getAttribute('data-src');
      });
      return;
    }
    document.querySelectorAll('iframe[data-src]').forEach(function(iframe) {
      var obs = new IntersectionObserver(function(entries) {
        entries.forEach(function(e) {
          if (e.isIntersecting) {
            iframe.src = iframe.getAttribute('data-src');
            obs.unobserve(iframe);
          }
        });
      }, { rootMargin: '300px' });
      obs.observe(iframe);
    });
  }



  /* ── STATS COUNTER — IntersectionObserver so it fires on scroll ─────── */
  function initStats() {
    var items = document.querySelectorAll('[data-count]');
    if (!items.length) return;
    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!window.IntersectionObserver || prefersReduced) {
      items.forEach(function(el) {
        el.textContent = el.getAttribute('data-count') + (el.getAttribute('data-suffix') || '');
      });
      return;
    }
    var obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        var el   = entry.target;
        var end  = parseInt(el.getAttribute('data-count'), 10);
        var suf  = el.getAttribute('data-suffix') || '';
        var dur  = 1400;
        var cur  = 0;
        var inc  = Math.ceil(end / (dur / 16));
        var timer = setInterval(function() {
          cur = Math.min(cur + inc, end);
          el.textContent = cur + suf;
          if (cur >= end) clearInterval(timer);
        }, 16);
        obs.unobserve(el);
      });
    }, { threshold: 0.3 });
    items.forEach(function(el) { obs.observe(el); });
  }

  function setYear() {
    var el = document.getElementById('footer-year');
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ── ARIA CURRENT PAGE ──────────────────────────────────────────────────── */
  function setCurrentPage() {
    var path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a, .drawer-nav-link').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (href === path || (path === '' && href === 'index.html')) {
        a.setAttribute('aria-current', 'page');
      }
    });
  }

  /* ── SMOOTH ANCHOR SCROLL ───────────────────────────────────────────────── */
  function initAnchorScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id  = a.getAttribute('href').slice(1);
        var el  = document.getElementById(id);
        if (!el) return;
        e.preventDefault();
        var navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 68;
        var top  = el.getBoundingClientRect().top + window.scrollY - navH - 12;
        window.scrollTo({ top: top, behavior: 'smooth' });
      });
    });
  }


  /* ── MORE DROPDOWN KEYBOARD HANDLER ────────────────────────────────────── */
  function initMoreDropdown() {
    var trigger = document.getElementById('nav-more-trigger');
    var menu    = document.getElementById('nav-more-menu');
    if (!trigger || !menu) return;

    function openMenu() {
      trigger.setAttribute('aria-expanded', 'true');
      menu.classList.add('is-open');
      // focus first item
      var first = menu.querySelector('a');
      if (first) setTimeout(function() { first.focus(); }, 50);
    }

    function closeMenu() {
      trigger.setAttribute('aria-expanded', 'false');
      menu.classList.remove('is-open');
    }

    trigger.addEventListener('click', function(e) {
      var expanded = trigger.getAttribute('aria-expanded') === 'true';
      expanded ? closeMenu() : openMenu();
    });

    // Close on Escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && trigger.getAttribute('aria-expanded') === 'true') {
        closeMenu();
        trigger.focus();
      }
    });

    // Close on outside click
    document.addEventListener('click', function(e) {
      if (!trigger.contains(e.target) && !menu.contains(e.target)) {
        closeMenu();
      }
    });

    // Close on blur (tab away from last item)
    menu.addEventListener('keydown', function(e) {
      if (e.key !== 'Tab') return;
      var items = Array.from(menu.querySelectorAll('a'));
      var last  = items[items.length - 1];
      if (!e.shiftKey && document.activeElement === last) {
        closeMenu();
      }
    });
  }

  /* ── REVIEW COUNT / RATING SYNC ─────────────────────────────────────────
     Single source of truth: data/reviews.json -> aggregate.{reviewCount,ratingValue}.
     Updates any element with [data-review-count] or [data-review-rating], and keeps
     the homepage stats counter ([data-count] on a [data-review-count] node) in sync. */
  function syncReviewCounts() {
    var countEls  = document.querySelectorAll('[data-review-count]');
    var ratingEls = document.querySelectorAll('[data-review-rating]');
    if (!countEls.length && !ratingEls.length) return;
    // Relative path resolves from / and /es/; service worker serves it
    // stale-while-revalidate, so no cache-busting needed.
    var url = (location.pathname.indexOf('/es/') !== -1 ? '../' : '') + 'data/reviews.json';
    fetch(url)
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (data) {
        var agg = (data && data.aggregate) || {};
        var count = agg.reviewCount, rating = agg.ratingValue;
        if (count != null) {
          countEls.forEach(function (el) {
            // If this element also drives the animated counter, update its source value.
            if (el.hasAttribute('data-count')) el.setAttribute('data-count', String(count));
            else el.textContent = String(count);
          });
        }
        if (rating != null) {
          ratingEls.forEach(function (el) { el.textContent = String(rating); });
        }
      })
      .catch(function () { /* leave hardcoded fallback values in place */ });
  }

  /* ── INIT ───────────────────────────────────────────────────────────────── */
  /* ── MOBILE BAR SPACING ──────────────────────────────────────────────────
     The fixed bottom action bar can include a status ribbon, so its height
     varies. Reserve its *actual* rendered height as body padding-bottom so the
     footer (Privacy / HIPAA links) is never hidden behind it. */
  function fitMobileBar() {
    var bar = document.getElementById('mobile-bar') || document.querySelector('.mobile-bar');
    if (!bar) return;
    var shown = window.getComputedStyle(bar).display !== 'none';
    document.body.style.paddingBottom = shown ? (bar.offsetHeight + 'px') : '';
  }


  /* ── SERVICES EXPAND BUTTON ─────────────────────────────────────────────── */
  function initServiceExpand() {
    var btn   = document.getElementById('svc-expand-btn');
    var extra = document.getElementById('svc-extra');
    if (!btn || !extra) return;

    // Count hidden service cards dynamically so label stays accurate if cards change
    var hiddenCount = extra.querySelectorAll('article').length;
    var moreLabel  = hiddenCount === 1 ? '1 more service' : hiddenCount + ' more services';

    btn.innerHTML = 'View all ' + moreLabel + ' <svg class="svgi" aria-hidden="true" focusable="false"><use href="images/icons-sprite.svg#i-chevron-down"/></svg>';

    btn.addEventListener('click', function () {
      var isOpen = extra.style.display !== 'none';

      if (isOpen) {
        extra.style.display = 'none';
        extra.setAttribute('aria-hidden', 'true');
        btn.setAttribute('aria-expanded', 'false');
        btn.innerHTML = 'View all ' + moreLabel + ' <svg class="svgi" aria-hidden="true" focusable="false"><use href="images/icons-sprite.svg#i-chevron-down"/></svg>';
      } else {
        extra.style.display = 'grid';
        extra.setAttribute('aria-hidden', 'false');
        btn.setAttribute('aria-expanded', 'true');
        btn.innerHTML = 'Show fewer services <svg class="svgi" aria-hidden="true" focusable="false"><use href="images/icons-sprite.svg#i-chevron-up"/></svg>';
        var first = extra.querySelector('article');
        if (first) { first.setAttribute('tabindex', '-1'); first.focus(); }
      }
    });
  }

  function init() {
    syncReviewCounts();
    initNav();
    initDrawer();
    // Activate focus trap on mobile drawer (WCAG 2.1 SC 2.1.2)
    var drawer = document.getElementById('mobile-drawer');
    if (drawer) trapFocus(drawer);
    initFAQ();
    initHours();
    initReveal();
    // initStats supersedes initCounters: respects prefers-reduced-motion,
    // uses 16ms rAF-aligned intervals, and handles data-suffix correctly.
    initStats();
    initGalleryFilter();
    setYear();
    setCurrentPage();
    initLazyMaps();
    initAnchorScroll();
    initMoreDropdown();
    initServiceExpand();
    fitMobileBar();
    // Re-measure after late layout/ribbon paint, and on viewport changes.
    setTimeout(fitMobileBar, 250);
    window.addEventListener('load', fitMobileBar);
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt); rt = setTimeout(fitMobileBar, 150);
    });
    window.addEventListener('orientationchange', function () {
      setTimeout(fitMobileBar, 200);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

/* ============================================================
   Review link wiring (v11)
   Any element with [data-review-link] gets its href from
   SITE_CONFIG.REVIEW_URL and fires analytics on click.
   Single source of truth = js/site-config.js -> REVIEW_URL.
   ============================================================ */
(function(){
  function wire(){
    var cfg = window.SITE_CONFIG || {};
    var url = cfg.REVIEW_URL || '';
    if (!url) return;
    var els = document.querySelectorAll('[data-review-link]');
    for (var i=0; i<els.length; i++){
      els[i].setAttribute('href', url);
      els[i].setAttribute('target', '_blank');
      els[i].setAttribute('rel', 'noopener noreferrer');
      els[i].addEventListener('click', function(e){
        var loc = e.currentTarget.getAttribute('data-track-location') || 'unknown';
        if (window.plausible){ try{ window.plausible('Review Click',{props:{location:loc}}); }catch(x){} }
        if (window.gtag){ try{ window.gtag('event','review_click',{event_category:'engagement',event_label:loc}); }catch(x){} }
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
})();

/* aria-current: set at runtime so nav/drawer chrome templates stay
   byte-identical across pages (see build.py CHROME SYNC). Hash-only or
   anchored links (e.g. index.html#section) are never marked. */
(function () {
  function mark() {
    var here = location.pathname.split('/').pop() || 'index.html';
    var links = document.querySelectorAll('.nav-links a, .nav-more-menu a, .drawer-nav-link');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href') || '';
      if (href.indexOf('#') !== -1) continue;
      if (href.split('/').pop() === here) links[i].setAttribute('aria-current', 'page');
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mark);
  } else { mark(); }
})();


/* Click-to-text activation (dark-launched).
   Enabled by SITE_CONFIG.ENABLE_SMS, or previewed via ?sms=1 on any URL.
   The button ships in the chrome hidden; this only reveals it. */
(function () {
  var cfg = window.SITE_CONFIG || {};
  var on = cfg.ENABLE_SMS === true || /[?&]sms=1(&|$)/.test(window.location.search);
  if (!on) return;
  var b = document.getElementById('cta-mobile-sms');
  if (!b) return;
  if (cfg.SMS_NUMBER) b.setAttribute('href', 'sms:' + cfg.SMS_NUMBER);
  b.hidden = false;
  var bar = document.getElementById('mobile-bar') || document.querySelector('.mobile-bar');
  if (bar) bar.classList.add('has-sms');
})();


/* ── STATUS RIBBON + CALL LABEL (mobile bar, sitewide) ─────────────────────
   Single source of truth: HOURS above (window.SVD_HOURS).
   Bilingual via <html lang>. Absorbed from page-extras.js (now removed). */
(function () {
  var ribbon = document.getElementById('mb-status-ribbon');
  var callLabel = document.getElementById('mb-call-label');
  var H = window.SVD_HOURS || {};
  var ES = (document.documentElement.lang || '').indexOf('es') === 0;
  var DAY_ES = { 0:'domingo',1:'lunes',2:'martes',3:'mi\u00e9rcoles',4:'jueves',5:'viernes',6:'s\u00e1bado' };
  function fmt(mins) {
    var h = Math.floor(mins / 60), m = mins % 60, ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + (m ? ':' + (m < 10 ? '0' : '') + m : ':00') + ' ' + ap;
  }
  function openNow() {
    var now = new Date(), h = H[now.getDay()];
    if (!h || h.open === null || h.open == null) return false;
    var tm = now.getHours() * 60 + now.getMinutes();
    return tm >= h.open && tm < h.close;
  }
  function nextOpenText() {
    var day = new Date().getDay();
    for (var i = 1; i <= 7; i++) {
      var d = (day + i) % 7, h = H[d];
      if (h && h.open != null) {
        return ES ? ('el ' + DAY_ES[d] + ' a las ' + fmt(h.open))
                  : ((h.label || DAY_ES[d]) + ' at ' + fmt(h.open));
      }
    }
    return ES ? 'el lunes' : 'Monday';
  }
  window.SVD_OPEN_NOW = openNow;      /* shared with the form note below */
  window.SVD_NEXT_OPEN = nextOpenText;
  if (!ribbon) return;
  if (openNow()) {
    ribbon.textContent = ES ? '\u25cf Abierto ahora \u2014 ll\u00e1menos directamente'
                            : '\u25cf Open now \u2014 call us directly';
    ribbon.style.cssText = 'background:#0F6E56;color:#fff;font-size:11px;font-weight:600;text-align:center;padding:4px 0;letter-spacing:.04em;display:block';
    if (callLabel) callLabel.textContent = ES ? 'Llamar ahora' : 'Call now';
  } else {
    ribbon.textContent = ES ? ('\u25cb Cerrado \u2014 abre ' + nextOpenText() + ' \u00b7 Env\u00edenos un mensaje')
                            : ('\u25cb Closed \u2014 next open ' + nextOpenText() + ' \u00b7 Send a message anytime');
    ribbon.style.cssText = 'background:#1A4D6B;color:rgba(255,255,255,.82);font-size:11px;font-weight:500;text-align:center;padding:4px 8px;display:block';
    if (callLabel) callLabel.textContent = ES ? 'Dejar msj' : 'Leave msg';
  }
})();

/* ── BACK TO TOP (absorbed from page-extras.js) ────────────────────────── */
(function () {
  var btn = document.getElementById('back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', function () {
    btn.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });
  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('main') && document.getElementById('main').focus();
  });
})();

/* ── CONTACT FORM HOURS NOTE ───────────────────────────────────────────────
   Fills #form-hours-note (contact pages) with an honest reply expectation. */
(function () {
  var el = document.getElementById('form-hours-note');
  if (!el || !window.SVD_OPEN_NOW) return;
  var ES = (document.documentElement.lang || '').indexOf('es') === 0;
  if (window.SVD_OPEN_NOW()) {
    el.textContent = ES ? 'Estamos abiertos ahora \u2014 para la respuesta m\u00e1s r\u00e1pida, ll\u00e1menos al (972) 852-2222.'
                        : 'We\u2019re open now \u2014 for the fastest response, call us at (972) 852-2222.';
  } else {
    el.textContent = ES ? ('Estamos cerrados en este momento \u2014 env\u00ede su solicitud y le responderemos cuando abramos ' + window.SVD_NEXT_OPEN() + '.')
                        : ('We\u2019re closed right now \u2014 send your request and we\u2019ll reply when we open ' + window.SVD_NEXT_OPEN() + '.');
  }
  el.hidden = false;
})();

/* ── LANGUAGE SUGGEST TOAST ────────────────────────────────────────────────
   Spanish-preference browser lands on an English page from OUTSIDE the site
   \u2192 one dismissible suggestion linking the page's own Spanish twin.
   One-directional by design: ES pages never nag toward English.
   Internal referrals are excluded so a deliberate language toggle never
   triggers it. Dismissal (or click-through) is remembered in localStorage. */
(function () {
  try {
    if ((document.documentElement.lang || '').indexOf('es') === 0) return;
    var langs = navigator.languages || [navigator.language || ''];
    var wantsEs = false;
    for (var i = 0; i < langs.length; i++) if ((langs[i] || '').toLowerCase().indexOf('es') === 0) wantsEs = true;
    if (!wantsEs) return;
    if (localStorage.getItem('svd-lang-suggest')) return;
    if (document.referrer && document.referrer.indexOf(location.host) !== -1) return;
    var link = document.querySelector('link[rel="alternate"][hreflang="es"]');
    if (!link || !link.href) return;
    var toast = document.createElement('div');
    toast.className = 'lang-toast';
    toast.setAttribute('role', 'region');
    toast.setAttribute('aria-label', 'Sugerencia de idioma');
    toast.innerHTML = '<strong>\u00bfPrefiere espa\u00f1ol?</strong>' +
      '<a href="' + link.href + '" data-track="lang-suggest" data-track-location="toast">Ver esta p\u00e1gina en espa\u00f1ol \u2192</a>' +
      '<button type="button" class="lang-toast-x" aria-label="Cerrar">\u00d7</button>';
    function remember() { try { localStorage.setItem('svd-lang-suggest', '1'); } catch (e) {} }
    toast.querySelector('a').addEventListener('click', remember);
    toast.querySelector('button').addEventListener('click', function () { remember(); toast.remove(); });
    setTimeout(function () {
      var bar = document.querySelector('.mobile-bar');
      var barShown = bar && window.getComputedStyle(bar).display !== 'none';
      toast.style.bottom = (barShown ? bar.offsetHeight + 10 : 16) + 'px';
      document.body.appendChild(toast);
    }, 800);
  } catch (e) {}
})();
