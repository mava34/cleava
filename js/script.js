/* ==========================================================
   CLEAVA — script.js
   Handles: sticky header · mobile menu · scroll reveal ·
            count-up · FAQ accordion · smooth scroll ·
            form demo · language switcher (FI/EN)
   ========================================================== */

(function () {
  'use strict';

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
     CONTACT FORM — Formspree backend
     1. Sign up at https://formspree.io
     2. Create a new form, set the notification email to info@cleava.fi
     3. Copy your form ID (the part after /f/ in the endpoint URL)
     4. Paste it below as the value of FORMSPREE_ID
  -------------------------------------------------------- */
  var FORMSPREE_ID = 'YOUR_FORM_ID'; // ← replace this

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

      fetch('https://formspree.io/f/' + FORMSPREE_ID, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form)
      })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.ok) {
          submit.textContent = msgs[currentLang].sent;
          submit.style.background = 'linear-gradient(135deg,#059669,#34D399)';
          form.reset();
          setTimeout(function () {
            submit.innerHTML = originalHTML;
            submit.style.background = '';
            submit.disabled = false;
          }, 4500);
        } else {
          showError();
        }
      })
      .catch(showError);
    });
  }

})();
