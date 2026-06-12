/* Open-now banner for emergency pages (June 2026 v6).
 * Reads window.SVD_HOURS (defined in core.js) and renders a live status
 * banner into #open-now-banner. Bilingual via data-lang on the container.
 * Degrades silently: no element, no SVD_HOURS, or JS off -> static page
 * content (which already carries the phone number) stands on its own. */
(function () {
  'use strict';
  var el = document.getElementById('open-now-banner');
  if (!el || !window.SVD_HOURS) return;

  var es = el.getAttribute('data-lang') === 'es';
  var now = new Date();
  var day = now.getDay();
  var mins = now.getHours() * 60 + now.getMinutes();
  var h = window.SVD_HOURS[day];
  var open = !!(h && h.open !== null && mins >= h.open && mins < h.close);

  var T = es ? {
    openMsg: 'Abiertos ahora — llame y lo atendemos hoy',
    soonSuffix: ' (cerramos pronto — llame ya)',
    closedMsg: 'Cerrados en este momento — env\u00edenos su solicitud y le llamamos',
    call: 'Llamar (972) 852-2222',
    request: 'Solicitar una llamada',
    contact: 'contacto.html'
  } : {
    openMsg: 'Open now — call and we\u2019ll see you today',
    soonSuffix: ' (closing soon — call right away)',
    closedMsg: 'Closed right now — send a request and we\u2019ll call you back',
    call: 'Call (972) 852-2222',
    request: 'Request a callback',
    contact: 'contact.html'
  };

  var closingSoon = open && (h.close - mins) <= 60;
  var msg = open ? (T.openMsg + (closingSoon ? T.soonSuffix : '')) : T.closedMsg;

  el.innerHTML =
    '<div class="open-now ' + (open ? 'is-open' : 'is-closed') + '" role="status">' +
      '<span class="open-now-dot" aria-hidden="true"></span>' +
      '<span class="open-now-msg">' + msg + '</span>' +
      (open
        ? '<a href="tel:+19728522222" class="btn btn-primary open-now-btn" data-track="emergency-call" data-track-location="open-now-banner">' + T.call + '</a>'
        : '<a href="' + T.contact + '" class="btn btn-outline open-now-btn">' + T.request + '</a>' +
          '<a href="tel:+19728522222" class="btn btn-primary open-now-btn" data-track="emergency-call" data-track-location="open-now-banner">' + T.call + '</a>') +
    '</div>';
})();
