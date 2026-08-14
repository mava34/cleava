/* ==========================================================
   CLEAVA — script.js
   Handles: sticky header · mobile menu · scroll reveal ·
            count-up · FAQ accordion · smooth scroll ·
            form demo · language switcher (FI/EN)
   ========================================================== */

(function () {
  'use strict';

  emailjs.init("irivADZOE-lea0Qxw");

  /* --------------------------------------------------------
     LANGUAGE SWITCHER — in-memory only, no localStorage
  -------------------------------------------------------- */
  var currentLang = 'fi';

  var pageTitles = {
    fi: 'Cleava – Luotettava siivouspalvelu pääkaupunkiseudulla',
    en: 'Cleava – Reliable Cleaning Services in Helsinki'
  };
  var metaDescriptions = {
    fi: 'Cleava – Pääkaupunkiseudun luotettava siivouspalvelu. Kotisiivous, muuttosiivous, ikkunanpesu. Tyytyväisyystakuu.',
    en: 'Cleava – Reliable cleaning services in the Helsinki metropolitan area. Home cleaning, move-out cleaning, window cleaning. Satisfaction guarantee.'
  };

  function setLanguage(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;
    document.title = pageTitles[lang];
    var metaEl = document.querySelector('meta[name="description"]');
    if (metaEl) metaEl.setAttribute('content', metaDescriptions[lang]);

    // Translate text content
    document.querySelectorAll('[data-fi]').forEach(function (el) {
      var text = el.dataset[lang];
      if (text === undefined) return;
      el.textContent = text;
    });

    // Translate input placeholders
    document.querySelectorAll('[data-fi-placeholder]').forEach(function (el) {
      var key = lang + 'Placeholder';
      if (el.dataset[key]) el.placeholder = el.dataset[key];
    });

    // Translate select options (their textContent was set by the loop above,
    // but options with translatable data-fi need textContent updated directly)
    document.querySelectorAll('option[data-fi]').forEach(function (el) {
      var text = el.dataset[lang];
      if (text !== undefined) el.textContent = text;
    });

    // Sync all lang-btn active state
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      var isActive = btn.dataset.lang === lang;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });

    // Re-render calculator result labels in new language
    if (typeof updateCalc === 'function') updateCalc();
  }

  document.querySelectorAll('.lang-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (this.dataset.lang !== currentLang) {
        setLanguage(this.dataset.lang);
      }
    });
  });

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --------------------------------------------------------
     STICKY HEADER — condense + shadow on scroll
  -------------------------------------------------------- */
  const header = document.getElementById('site-header');

  window.addEventListener('scroll', function () {
    header.classList.toggle('scrolled', window.scrollY > 48);
  }, { passive: true });


  /* --------------------------------------------------------
     MOBILE MENU
  -------------------------------------------------------- */
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileClose = document.getElementById('mobile-close');
  const mobileLinks = mobileMenu.querySelectorAll('.mobile-link, .mobile-cta');

  function openMenu() {
    mobileMenu.removeAttribute('hidden');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    // Small tick so CSS opacity transition fires after display:flex kicks in
    requestAnimationFrame(() => {
      mobileMenu.style.pointerEvents = 'all';
    });
    const firstLink = mobileMenu.querySelector('.mobile-link');
    if (firstLink) setTimeout(() => firstLink.focus(), 50);
  }

  function closeMenu() {
    mobileMenu.setAttribute('hidden', '');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Avaa valikko');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', function () {
    const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
    isOpen ? closeMenu() : openMenu();
  });

  mobileClose.addEventListener('click', closeMenu);

  mobileLinks.forEach(link => link.addEventListener('click', closeMenu));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && hamburger.getAttribute('aria-expanded') === 'true') closeMenu();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 960 && hamburger.getAttribute('aria-expanded') === 'true') closeMenu();
  }, { passive: true });


  /* --------------------------------------------------------
     SMOOTH SCROLL — offset for sticky header
  -------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const id = this.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const offset = header.offsetHeight + 16;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  });


  /* --------------------------------------------------------
     SCROLL REVEAL — IntersectionObserver, staggered
  -------------------------------------------------------- */
  if (!prefersReducedMotion) {
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.10, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  }


  /* --------------------------------------------------------
     COUNT-UP — animates stat numbers when they enter view
  -------------------------------------------------------- */
  function animateCount(el) {
    const target   = parseFloat(el.dataset.target);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const suffix   = el.dataset.suffix || '';
    const duration = 2200;
    const startTs  = performance.now();

    function tick(now) {
      const elapsed  = now - startTs;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  if (!prefersReducedMotion) {
    const countObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });

    document.querySelectorAll('.stat-num[data-target]').forEach(el => countObs.observe(el));
  }


  /* --------------------------------------------------------
     FAQ ACCORDION — keyboard accessible, aria-expanded
  -------------------------------------------------------- */
  const faqButtons = document.querySelectorAll('.faq-q');

  faqButtons.forEach(btn => {
    btn.addEventListener('click', function () {
      const expanded = this.getAttribute('aria-expanded') === 'true';
      const answerId = this.getAttribute('aria-controls');
      const answer   = document.getElementById(answerId);

      // Close all other open items
      faqButtons.forEach(other => {
        if (other !== this) {
          other.setAttribute('aria-expanded', 'false');
          const otherId = other.getAttribute('aria-controls');
          const otherA  = document.getElementById(otherId);
          if (otherA) otherA.setAttribute('hidden', '');
        }
      });

      // Toggle current
      if (expanded) {
        this.setAttribute('aria-expanded', 'false');
        answer.setAttribute('hidden', '');
      } else {
        this.setAttribute('aria-expanded', 'true');
        answer.removeAttribute('hidden');
      }
    });
  });


  /* --------------------------------------------------------
     CONTACT FORM — EmailJS
     Service: service_rk1v7r2 · Template: template_ivpuzsb
  -------------------------------------------------------- */
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const submit = form.querySelector('.cf-submit');
      const originalHTML = submit.innerHTML;
      let valid = true;

      // Required-field highlight
      form.querySelectorAll('[required]').forEach(field => {
        if (!field.value.trim()) {
          field.style.borderColor = '#F43F5E';
          valid = false;
          field.addEventListener('input', () => { field.style.borderColor = ''; }, { once: true });
        }
      });

      if (!valid) return;

      var msgs = {
        fi: {
          sending: 'Lähetetään…',
          sent:    '✓ Tarjouspyyntö lähetetty!',
          error:   'Lähetys epäonnistui — yritä uudelleen tai soita meille.'
        },
        en: {
          sending: 'Sending…',
          sent:    '✓ Quote request sent!',
          error:   'Failed to send — please try again or call us.'
        }
      };

      function showError() {
        submit.textContent = msgs[currentLang].error;
        submit.style.background = 'linear-gradient(135deg,#dc2626,#f87171)';
        submit.disabled = false;
        setTimeout(function () {
          submit.innerHTML = originalHTML;
          submit.style.background = '';
        }, 4000);
      }

      submit.textContent = msgs[currentLang].sending;
      submit.disabled = true;

      emailjs.sendForm('service_rk1v7r2', 'template_ivpuzsb', form)
        .then(function () {
          submit.textContent = msgs[currentLang].sent;
          submit.style.background = 'linear-gradient(135deg,#059669,#34D399)';
          form.reset();
          setTimeout(function () {
            submit.innerHTML = originalHTML;
            submit.style.background = '';
            submit.disabled = false;
          }, 4500);
        })
        .catch(showError);
    });
  }


  /* --------------------------------------------------------
     KOTITALOUSVÄHENNYS LASKIN
  -------------------------------------------------------- */
  var calcFreq  = document.getElementById('calc-freq');
  var calcHours = document.getElementById('calc-hours');
  var calcRate  = document.getElementById('calc-rate');

  function updateCalc() {
    if (!calcFreq || !calcHours || !calcRate) return;

    var freq  = parseInt(calcFreq.value, 10)  || 2;
    var hours = parseInt(calcHours.value, 10) || 3;
    var rate  = parseFloat(calcRate.value)    || 39;

    var yearlyTotal = freq * 12 * hours * rate;
    var deductible  = yearlyTotal * 0.40;
    var saving      = Math.max(0, Math.min(deductible - 100, 2100));
    var netCost     = yearlyTotal - saving;

    var fmt = function (n) { return n.toLocaleString('fi-FI', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }); };

    var resTotal     = document.getElementById('res-total');
    var resDeduction = document.getElementById('res-deduction');
    var resNet       = document.getElementById('res-net');

    if (resTotal)     resTotal.textContent     = fmt(yearlyTotal);
    if (resDeduction) resDeduction.textContent = saving > 0 ? '− ' + fmt(saving) : (currentLang === 'fi' ? 'Ei oikeutta' : 'Not eligible');
    if (resNet)       resNet.textContent       = fmt(netCost);

    // Update ARIA values
    calcFreq.setAttribute('aria-valuenow',  calcFreq.value);
    calcHours.setAttribute('aria-valuenow', calcHours.value);

    // Live badge displays
    var freqBadge  = document.getElementById('calc-freq-display');
    var hoursBadge = document.getElementById('calc-hours-display');
    if (freqBadge)  freqBadge.textContent  = calcFreq.value;
    if (hoursBadge) hoursBadge.textContent = calcHours.value;

    // Tinted track fill via inline background
    function fillTrack(el, min, max) {
      var pct = ((parseInt(el.value, 10) - min) / (max - min)) * 100;
      el.style.background = 'linear-gradient(to right, var(--primary) ' + pct + '%, rgba(255,255,255,.12) ' + pct + '%)';
    }
    fillTrack(calcFreq,  1, 8);
    fillTrack(calcHours, 1, 10);
  }

  if (calcFreq && calcHours && calcRate) {
    calcFreq.addEventListener('input',  updateCalc);
    calcHours.addEventListener('input', updateCalc);
    calcRate.addEventListener('input',  updateCalc);
    calcRate.addEventListener('change', updateCalc);
    updateCalc();
  }

})();
