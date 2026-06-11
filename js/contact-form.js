/* Contact / appointment form handler — externalized from contact.html (June 2026 v5, CSP prep).
 * Submits to Web3Forms via fetch; shows accessible inline + summary errors.
 * Sets inline style.display directly, which intentionally overrides the
 * .is-hidden utility class used for initial hidden state. */
(function() {
          'use strict';

          var form    = document.getElementById('contact-form');
          var success = document.getElementById('form-success');
          var submit  = document.getElementById('cta-form-submit');
          if (!form) return;

          function showErr(id, show) {
            var el    = document.getElementById(id + '-err');
            var input = document.querySelector('[aria-describedby="' + id + '-err"]');
            if (el) {
              el.style.display = show ? 'flex' : 'none';
              el.setAttribute('aria-live', 'assertive');
            }
            if (input) {
              if (show) input.classList.add('form-field-error');
              else      input.classList.remove('form-field-error');
            }
          }

          function validateEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }
          function validatePhone(v) { return v.replace(/\D/g, '').length >= 10; }

          function setLoading(loading) {
            if (submit) {
              submit.disabled = loading;
              submit.innerHTML = loading
                ? '<span class="spinner" aria-hidden="true"></span> Sending…'
                : '<svg class="svgi" aria-hidden="true" focusable="false"><use href="images/icons-sprite.svg#i-send"/></svg> Send appointment request';
            }
          }

          function showSuccess(data) {
            // Hide the form (overrides its inline display:flex)
            form.style.display = 'none';
            // Stop the spinner
            setLoading(false);
            // Show the success div — it lives OUTSIDE the form so hiding the form
            // doesn't affect it. Use display:block then rAF for the fade-in.
            success.style.display = 'block';
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
              el.textContent = msg || 'Something went wrong. Please call us at (972) 852-2222.';
              el.style.display = 'flex';
              el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }

          form.addEventListener('submit', function(e) {
            e.preventDefault();

            var fields = {
              fname:   { el: document.getElementById('fname'),   req: function(v){ return !!v.trim(); } },
              lname:   { el: document.getElementById('lname'),   req: function(v){ return !!v.trim(); } },
              phone:   { el: document.getElementById('phone'),   req: validatePhone },
              email:   { el: document.getElementById('email'),   req: validateEmail },
              service: { el: document.getElementById('service'), req: function(v){ return !!v; } }
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

            if (!valid) {
              if (firstBad) firstBad.focus();
              return;
            }

            setLoading(true);
            document.getElementById('form-server-error') &&
              (document.getElementById('form-server-error').style.display = 'none');

            var formData = new FormData(form);

            fetch(form.getAttribute('action'), {
              method: 'POST',
              body: formData,
              headers: { 'Accept': 'application/json' }
            })
            .then(function(res) { return res.json(); })
            .then(function(data) {
              if (data.success) {
                form.dataset.successHandled = 'true';
                showSuccess({ fname: document.getElementById('fname').value.trim() });
                /* Fire conversion analytics via the shared hook in analytics.js
                   (Plausible "Form Success" + GA4 form_submission_success). */
                if (typeof window.svdFormSuccess === 'function') {
                  window.svdFormSuccess();
                }
              } else {
                setLoading(false);
                showError(data.message || null);
              }
            })
            .catch(function() {
              setLoading(false);
              showError('Network error. Please check your connection and try again.');
            });
          });

          Object.keys({ fname:1, lname:1, phone:1, email:1, service:1 }).forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener('input', function() { showErr(id, false); });
          });
        })();
        
