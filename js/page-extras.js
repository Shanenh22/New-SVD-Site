/* Page extras — status ribbon + back-to-top (externalized from index.html, v5). */
/* Status ribbon — reads from window.SVD_HOURS set by core.js.
   Falls back to inline config if core.js hasn't loaded yet (first paint). */
(function(){
  var H = window.SVD_HOURS || {
    1: {open:600,  close:1140},
    2: {open:510,  close:960 },
    3: {open:600,  close:1140},
    5: {open:480,  close:900 }
  };
  var OPEN_LABELS = {1:'Monday',2:'Tuesday',3:'Wednesday',4:'Thursday',5:'Friday',6:'Saturday',0:'Sunday'};
  var OPEN_TIMES  = {1:'10:00 AM',2:'8:30 AM',3:'10:00 AM',5:'8:00 AM'};
  function isOpen(){
    var now = new Date(), day = now.getDay(), h = H[day];
    if (!h) return false;
    var o = h.open  != null ? h.open  : (h.o != null ? h.o : null);
    var c = h.close != null ? h.close : (h.c != null ? h.c : null);
    if (o == null) return false;
    var cur = now.getHours() * 60 + now.getMinutes();
    return cur >= o && cur < c;
  }
  function nextOpen(){
    var day = new Date().getDay();
    for(var i=1;i<=7;i++){
      var d = (day + i) % 7, h = H[d];
      if(h && (h.open != null || h.o != null)) return OPEN_LABELS[d] + ' at ' + (OPEN_TIMES[d] || 'opening time');
    }
    return 'Monday';
  }
  var ribbon = document.getElementById('mb-status-ribbon');
  var callLabel = document.getElementById('mb-call-label');
  if (!ribbon) return;
  if (isOpen()){
    ribbon.textContent = '● Open now — call us directly';
    ribbon.style.cssText = 'background:#0F6E56;color:#fff;font-size:11px;font-weight:600;text-align:center;padding:4px 0;letter-spacing:.04em;display:block';
    if(callLabel) callLabel.textContent = 'Call now';
  } else {
    ribbon.textContent = '○ Closed — next open ' + nextOpen() + ' · Send a message anytime';
    ribbon.style.cssText = 'background:#1A4D6B;color:rgba(255,255,255,.82);font-size:11px;font-weight:500;text-align:center;padding:4px 8px;display:block';
    if(callLabel) callLabel.textContent = 'Leave msg';
  }
})();

/* Back to top button */
(function(){
  var btn = document.getElementById('back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', function() {
    btn.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });
  btn.addEventListener('click', function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('main') && document.getElementById('main').focus();
  });
})();
