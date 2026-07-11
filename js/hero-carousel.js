/* ── Hero background carousel (index pages) ──
 * Externalized from inline script (June 2026 v5).
 * - Respects prefers-reduced-motion: rotation never starts; static slide 1 shows.
 * - Pause/play toggle swaps the SVG sprite symbol (icon webfont retired).
 * - Path prefix auto-detected so the same file works from / and /es/.
 */
(function () {
  'use strict';
  var slides = document.querySelectorAll('.hero-bg-slide');
  if (!slides.length) return;

  var PREFIX = location.pathname.indexOf('/es/') !== -1 ? '../' : '';
  var slideLabels = PREFIX
    ? ['Familia sonriente en un pícnic en el parque', 'Paciente sonriente en nuestro consultorio', 'Primer plano de una sonrisa saludable', 'Dos pacientes jóvenes en la sala de tratamiento']
    : ['Smiling family at a park picnic', 'Smiling patient in our office', 'Close-up of a healthy smile', 'Two young patients in a treatment room'];
  var current = 0;
  var INTERVAL = 5500;
  var timer = null;
  var paused = false;
  var pauseBtn = document.getElementById('carousel-pause');
  var announce = document.getElementById('carousel-announce');
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Reduced motion: no rotation, no slide preloads, button hidden via CSS. */
  if (prefersReduced) return;

  function preloadSlides() {
    ['images/hero-slide-2.webp', 'images/hero-slide-3.webp', 'images/hero-slide-4.webp']
      .forEach(function (src) {
        var l = document.createElement('link');
        l.rel = 'preload'; l.as = 'image'; l.href = PREFIX + src;
        document.head.appendChild(l);
      });
  }

  function goTo(idx) {
    slides[current].classList.remove('is-active');
    current = idx % slides.length;
    slides[current].classList.add('is-active');
    if (announce) announce.textContent = slideLabels[current] || '';
  }

  function next() { goTo(current + 1); }

  function start() {
    if (timer) clearInterval(timer);
    timer = setInterval(next, INTERVAL);
  }

  function stop() {
    clearInterval(timer);
    timer = null;
  }

  if (pauseBtn) {
    pauseBtn.addEventListener('click', function () {
      paused = !paused;
      pauseBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
      pauseBtn.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
      var use = pauseBtn.querySelector('use');
      if (use) {
        use.setAttribute('href', PREFIX + 'images/icons-sprite.svg#i-player-' + (paused ? 'play' : 'pause'));
      }
      paused ? stop() : start();
    });
  }

  document.addEventListener('visibilitychange', function () {
    if (paused) return;
    document.hidden ? stop() : start();
  });

  if (document.readyState === 'complete') {
    preloadSlides(); start();
  } else {
    window.addEventListener('load', function () { preloadSlides(); start(); });
  }
})();
