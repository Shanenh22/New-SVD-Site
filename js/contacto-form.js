/* Formulario de contacto (ES) — externalizado de es/contacto.html (v6).
 * Redirige a gracias.html tras enviar, para conversion tracking por URL. */
(function() {
  'use strict';
  var form    = document.getElementById('contact-form');
  var success = document.getElementById('form-success');
  var submit  = document.getElementById('form-submit-btn');
  var serviceEl = document.getElementById('service');
  var messageWrap = document.getElementById('message-wrap');
  var messageEl = document.getElementById('message');
  var msgOptional = document.getElementById('message-optional');
  var msgRequiredStar = document.getElementById('message-required-star');
  if (!form) return;

  // Show/hide message field requirement based on "Otro" selection
  if (serviceEl) {
    serviceEl.addEventListener('change', function() {
      var isOther = this.value === 'other';
      if (isOther) {
        msgOptional.style.display = 'none';
        msgRequiredStar.style.display = 'inline';
        messageEl.setAttribute('required', '');
        messageEl.placeholder = 'Por favor descríba su consulta...';
      } else {
        msgOptional.style.display = '';
        msgRequiredStar.style.display = 'none';
        messageEl.removeAttribute('required');
        messageEl.placeholder = 'Cuéntenos más sobre su consulta...';
      }
    });
  }

  function showErr(id, show) {
    var el    = document.getElementById(id + '-err');
    var input = document.querySelector('[aria-describedby="' + id + '-err"]');
    if (el) { el.style.display = show ? 'flex' : 'none'; el.setAttribute('aria-live', 'assertive'); }
    if (input) { show ? input.classList.add('form-field-error') : input.classList.remove('form-field-error'); }
  }

  function validateEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }
  function validatePhone(v) { return v.replace(/\D/g,'').length >= 10; }

  function setLoading(loading) {
    if (submit) {
      submit.disabled = loading;
      submit.innerHTML = loading
        ? '<span class="spinner" aria-hidden="true"></span> Enviando...'
        : '<svg class="svgi" aria-hidden="true" focusable="false"><use href="../images/icons-sprite.svg#i-send"/></svg> Enviar solicitud';
    }
  }

  function showSuccess() {
    form.style.display = 'none';
    setLoading(false);
    success.style.display = 'block';
            setTimeout(function(){ window.location.href='gracias.html'; }, 1200);
    success.style.opacity = '0';
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        success.style.opacity = '1';
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
  }

  function showError(msg) {
    var el = document.getElementById('form-server-error');
    if (el) {
      el.querySelector('span').textContent = msg || 'Algo salió mal. Por favor llámenos al (972) 852-2222.';
      el.style.display = 'flex';
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var isOther = serviceEl && serviceEl.value === 'other';
    var fields = {
      fname:   { el: document.getElementById('fname'),   req: function(v){ return !!v.trim(); } },
      lname:   { el: document.getElementById('lname'),   req: function(v){ return !!v.trim(); } },
      phone:   { el: document.getElementById('phone'),   req: validatePhone },
      email:   { el: document.getElementById('email'),   req: validateEmail },
      service: { el: serviceEl,                          req: function(v){ return !!v; } },
      message: { el: messageEl,                          req: function(v){ return !isOther || !!v.trim(); } }
    };

    var valid = true;
    var firstBad = null;
    Object.keys(fields).forEach(function(id) {
      var val = fields[id].el ? fields[id].el.value : '';
      var ok  = fields[id].req(val);
      showErr(id, !ok);
      if (!ok && !firstBad) firstBad = fields[id].el;
      if (!ok) valid = false;
    });

    if (!valid) { if (firstBad) firstBad.focus(); return; }

    setLoading(true);
    var errEl = document.getElementById('form-server-error');
    if (errEl) errEl.style.display = 'none';

    fetch(form.getAttribute('action'), {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data.success) {
        showSuccess();
        if (window.gtag) gtag('event', 'generate_lead', { event_category: 'conversion', event_label: 'es_contact_form', value: 1 });
      } else {
        setLoading(false);
        showError(data.message || null);
      }
    })
    .catch(function() {
      setLoading(false);
      showError('Error de red. Por favor verifique su conexión e intente de nuevo.');
    });
  });

  ['fname','lname','phone','email','service','message'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', function() { showErr(id, false); });
  });
})();

