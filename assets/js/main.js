/* ============================================================
   NOIR — main.js
   Vanilla JS. No libraries. All features:
   preloader, custom cursor, scroll progress, header glass,
   fullscreen burger menu, smooth anchors, IO reveal,
   parallax (rAF, transforms only), counters, magnetic buttons,
   3D tilt cards, accordion, wine rows, testimonial slider,
   lightbox, booking form validation, back-to-top,
   hero video fallback.
   ============================================================ */
'use strict';

(function () {

  /* ---------- helpers ---------- */
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  var body = document.body;
  var header = $('#header');
  var progressBar = $('#progressBar');
  var toTop = $('#toTop');

  /* ============================================================
     PRELOADER — «NOIR» letters (CSS) + gold % counter + curtain
     ============================================================ */
  (function preloader() {
    var pre = $('#preloader');
    var num = $('#preloaderNum');
    if (!pre || !num) return;

    var duration = reducedMotion ? 350 : 2100;
    var start = null;

    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / duration);
      num.textContent = Math.round(easeOutCubic(p) * 100);
      if (p < 1) {
        window.requestAnimationFrame(step);
      } else {
        finish();
      }
    }

    function finish() {
      pre.classList.add('is-done');
      body.classList.remove('is-loading');
      window.setTimeout(function () {
        if (pre.parentNode) pre.parentNode.removeChild(pre);
      }, reducedMotion ? 80 : 1100);
    }

    window.requestAnimationFrame(step);
  })();

  /* ============================================================
     HERO VIDEO FALLBACK — onerror / canplay timeout → gradient
     ============================================================ */
  (function heroVideoFallback() {
    var video = $('#heroVideo');
    var hero = $('#hero');
    if (!video || !hero) return;

    var handled = false;

    function showFallback() {
      if (handled) return;
      handled = true;
      hero.classList.add('video-failed');
    }

    function recover() {
      handled = false;
      hero.classList.remove('video-failed');
    }

    video.addEventListener('error', showFallback, true);
    var source = video.querySelector('source');
    if (source) source.addEventListener('error', showFallback);

    /* if the stream never becomes playable, switch to gradient */
    var timer = window.setTimeout(function () {
      if (video.readyState < 3) showFallback();
    }, 6000);

    video.addEventListener('canplay', function () {
      window.clearTimeout(timer);
      recover();
    });

    /* silence unhandled autoplay rejection */
    var playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function () { /* muted autoplay blocked — poster stays */ });
    }
  })();

  /* ============================================================
     SCROLL EFFECTS — progress bar, header glass, to-top, parallax
     (single rAF tick, transforms only)
     ============================================================ */
  var parallaxItems = [];
  (function collectParallax() {
    $$('[data-parallax]').forEach(function (el) {
      parallaxItems.push({
        el: el,
        speed: parseFloat(el.getAttribute('data-parallax')) || 0.1,
        scale: parseFloat(el.getAttribute('data-parallax-scale')) || 0,
        docTop: 0,
        height: 0
      });
    });
  })();

  function measureParallax() {
    parallaxItems.forEach(function (item) {
      var top = 0;
      var node = item.el;
      while (node) { top += node.offsetTop; node = node.offsetParent; }
      item.docTop = top;
      item.height = item.el.offsetHeight;
    });
  }

  function applyParallax(scrollY) {
    if (reducedMotion) return;
    var vh = window.innerHeight;
    parallaxItems.forEach(function (item) {
      var center = item.docTop + item.height / 2 - scrollY;
      if (center < -vh || center > vh * 2) return; // far off-screen
      var delta = (center - vh / 2) * item.speed;
      var transform = 'translate3d(0,' + delta.toFixed(1) + 'px,0)';
      if (item.scale) transform += ' scale(' + item.scale + ')';
      item.el.style.transform = transform;
    });
  }

  function onScrollFrame() {
    var y = window.pageYOffset || document.documentElement.scrollTop;

    /* header glass */
    if (header) header.classList.toggle('is-scrolled', y > 32);

    /* scroll progress */
    if (progressBar) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? Math.min(1, y / max) : 0;
      progressBar.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
    }

    /* back-to-top */
    if (toTop) toTop.classList.toggle('is-visible', y > 700);

    applyParallax(y);
  }

  var ticking = false;
  function requestScrollFrame() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      onScrollFrame();
      ticking = false;
    });
  }

  window.addEventListener('scroll', requestScrollFrame, { passive: true });
  window.addEventListener('resize', function () {
    measureParallax();
    requestScrollFrame();
  }, { passive: true });

  /* ============================================================
     CUSTOM CURSOR — dot + ring, pointer:fine only, grows on hover
     ============================================================ */
  (function customCursor() {
    if (!finePointer || reducedMotion) return;

    var dot = $('#cursorDot');
    var ring = $('#cursorRing');
    if (!dot || !ring) return;

    body.classList.add('has-cursor');

    var mx = window.innerWidth / 2;
    var my = window.innerHeight / 2;
    var rx = mx;
    var ry = my;
    var started = false;

    window.addEventListener('mousemove', function (e) {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
      body.classList.add('cursor-active');
      started = true;
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      body.classList.remove('cursor-active');
    });
    document.addEventListener('mouseenter', function () {
      if (started) body.classList.add('cursor-active');
    });

    (function loop() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
      window.requestAnimationFrame(loop);
    })();

    var interactive = 'a, button, [data-tilt], input, select, textarea, label, .wine-row__head';
    document.addEventListener('mouseover', function (e) {
      body.classList.toggle('cursor-hover', !!(e.target.closest && e.target.closest(interactive)));
    }, { passive: true });
  })();

  /* ============================================================
     BURGER / FULLSCREEN MENU with staggered serif links
     ============================================================ */
  function setMenu(open) {
    body.classList.toggle('is-menu-open', open);
    var burger = $('#burger');
    var menu = $('#menu');
    if (!burger || !menu) return;
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
  }

  function toggleMenu() {
    setMenu(!body.classList.contains('is-menu-open'));
  }

  (function burgerMenu() {
    var burger = $('#burger');
    var menu = $('#menu');
    if (!burger || !menu) return;

    burger.addEventListener('click', toggleMenu);

    $$('.menu__link, .menu__footer a', menu).forEach(function (link) {
      link.addEventListener('click', function () { setMenu(false); });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && body.classList.contains('is-menu-open')) setMenu(false);
    });
  })();

  /* ============================================================
     SMOOTH ANCHOR SCROLL (header offset aware)
     ============================================================ */
  (function smoothAnchors() {
    $$('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var id = link.getAttribute('href');
        if (!id || id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();

        setMenu(false);

        var headerH = header ? header.offsetHeight : 0;
        var y = target.getBoundingClientRect().top + (window.pageYOffset || 0);
        if (id !== '#hero') y -= headerH;

        window.scrollTo({
          top: Math.max(0, y),
          behavior: reducedMotion ? 'auto' : 'smooth'
        });
        if (window.history && window.history.pushState) {
          window.history.pushState(null, '', id);
        }
      });
    });
  })();

  /* ============================================================
     REVEAL ON VIEW — IntersectionObserver, once + stagger
     ============================================================ */
  (function reveal() {
    var groups = $$('[data-stagger]');
    groups.forEach(function (group) {
      Array.prototype.forEach.call(group.children, function (child, i) {
        child.classList.add('reveal');
        child.style.setProperty('--d', (i * 0.09).toFixed(2) + 's');
      });
    });

    var items = $$('.reveal');
    if (!items.length) return;

    if (reducedMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -7% 0px' });

    items.forEach(function (el) { io.observe(el); });
  })();

  /* ============================================================
     ANIMATED COUNTERS — on view, easeOutCubic
     ============================================================ */
  (function counters() {
    var nums = $$('.counter__num');
    if (!nums.length) return;

    function animate(el) {
      var target = parseInt(el.getAttribute('data-target'), 10) || 0;
      if (reducedMotion) { el.textContent = String(target); return; }
      var duration = 1700;
      var start = null;

      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min(1, (ts - start) / duration);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(eased * target));
        if (p < 1) window.requestAnimationFrame(step);
      }
      window.requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) {
      nums.forEach(function (el) { animate(el); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animate(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });

    nums.forEach(function (el) { io.observe(el); });
  })();

  /* ============================================================
     MAGNETIC BUTTONS — desktop only
     ============================================================ */
  (function magnetic() {
    if (!finePointer || reducedMotion) return;
    $$('.magnetic').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - (r.left + r.width / 2);
        var y = e.clientY - (r.top + r.height / 2);
        btn.style.transform = 'translate(' + (x * 0.18).toFixed(1) + 'px,' + (y * 0.24).toFixed(1) + 'px)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  })();

  /* ============================================================
     3D TILT CARDS — desktop only, transforms only
     ============================================================ */
  (function tilt() {
    if (!finePointer || reducedMotion) return;
    $$('[data-tilt]').forEach(function (card) {
      var maxTilt = 8;

      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width;
        var y = (e.clientY - r.top) / r.height;
        card.classList.add('is-tilting');
        card.style.transform =
          'perspective(900px) rotateX(' + ((0.5 - y) * maxTilt).toFixed(2) + 'deg)' +
          ' rotateY(' + ((x - 0.5) * maxTilt * 1.2).toFixed(2) + 'deg)' +
          ' translateY(-4px)';
        card.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
        card.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
      });

      card.addEventListener('mouseleave', function () {
        card.classList.remove('is-tilting');
        card.style.transform = '';
      });
    });
  })();

  /* ============================================================
     ACCORDION — дегустационный сет (one open at a time)
     ============================================================ */
  (function accordion() {
    var items = $$('.acc__item');
    if (!items.length) return;

    items.forEach(function (item) {
      var head = $('.acc__head', item);
      if (!head) return;
      head.addEventListener('click', function () {
        var wasOpen = item.classList.contains('is-open');
        items.forEach(function (other) {
          other.classList.remove('is-open');
          var h = $('.acc__head', other);
          if (h) h.setAttribute('aria-expanded', 'false');
        });
        if (!wasOpen) {
          item.classList.add('is-open');
          head.setAttribute('aria-expanded', 'true');
        }
      });
    });
  })();

  /* ============================================================
     WINE REGIONS — hover expansion (desktop) + click toggle
     ============================================================ */
  (function wineRows() {
    var rows = $$('.wine-row');
    if (!rows.length) return;

    function openRow(row) {
      rows.forEach(function (other) {
        other.classList.toggle('is-open', other === row);
        var h = $('.wine-row__head', other);
        if (h) h.setAttribute('aria-expanded', other === row ? 'true' : 'false');
      });
    }

    function closeRow(row) {
      row.classList.remove('is-open');
      var h = $('.wine-row__head', row);
      if (h) h.setAttribute('aria-expanded', 'false');
    }

    rows.forEach(function (row) {
      var head = $('.wine-row__head', row);
      if (!head) return;
      head.addEventListener('click', function () {
        if (row.classList.contains('is-open')) closeRow(row);
        else openRow(row);
      });
      if (finePointer && !reducedMotion) {
        row.addEventListener('mouseenter', function () { openRow(row); });
        row.addEventListener('mouseleave', function () { closeRow(row); });
      }
    });
  })();

  /* ============================================================
     TESTIMONIAL SLIDER — arrows + dots + swipe + autoplay 6s
     ============================================================ */
  (function slider() {
    var root = $('#reviewsSlider');
    if (!root) return;

    var viewport = $('.slider__viewport', root);
    var track = $('.slider__track', root);
    var slides = $$('.review', root);
    var dotsWrap = $('.slider__dots', root);
    if (!viewport || !track || !slides.length || !dotsWrap) return;

    var index = 0;
    var timer = null;

    var dots = slides.map(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'slider__dot';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', 'Отзыв ' + (i + 1));
      b.addEventListener('click', function () { goTo(i); restart(); });
      dotsWrap.appendChild(b);
      return b;
    });

    function goTo(n) {
      index = (n + slides.length) % slides.length;
      track.style.transform = 'translateX(-' + (index * 100) + '%)';
      slides.forEach(function (s, i) { s.classList.toggle('is-active', i === index); });
      dots.forEach(function (d, i) {
        d.classList.toggle('is-active', i === index);
        d.setAttribute('aria-selected', i === index ? 'true' : 'false');
      });
    }

    function next() { goTo(index + 1); }
    function stop() { if (timer) { window.clearInterval(timer); timer = null; } }
    function start() {
      if (reducedMotion) return;
      stop();
      timer = window.setInterval(next, 6000);
    }
    function restart() { stop(); start(); }

    $$('.slider__arrow', root).forEach(function (arrow) {
      arrow.addEventListener('click', function () {
        goTo(index + parseInt(arrow.getAttribute('data-dir'), 10));
        restart();
      });
    });

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', start);

    /* touch swipe (pointer events) */
    var startX = 0;
    var currentX = 0;
    var dragging = false;

    viewport.addEventListener('pointerdown', function (e) {
      dragging = true;
      startX = e.clientX;
      currentX = e.clientX;
      stop();
    });

    viewport.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      currentX = e.clientX;
      var dx = currentX - startX;
      if (Math.abs(dx) > 8) {
        track.style.transition = 'none';
        track.style.transform = 'translateX(calc(-' + (index * 100) + '% + ' + dx + 'px))';
      }
    });

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      track.style.transition = '';
      track.style.transform = 'translateX(-' + (index * 100) + '%)';
      var dx = currentX - startX;
      if (Math.abs(dx) > 55) {
        goTo(dx < 0 ? index + 1 : index - 1);
      }
      restart();
    }

    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    viewport.addEventListener('pointerleave', endDrag);

    goTo(0);
    start();
  })();

  /* ============================================================
     LIGHTBOX — gallery: fullscreen, caption, arrows, Esc
     ============================================================ */
  (function lightbox() {
    var lb = $('#lightbox');
    var items = $$('.gallery__item');
    if (!lb || !items.length) return;

    var img = $('.lightbox__img', lb);
    var caption = $('.lightbox__caption', lb);
    var count = $('.lightbox__count', lb);

    var data = items.map(function (btn) {
      var image = $('img', btn);
      return {
        src: btn.getAttribute('data-src') || (image ? image.src : ''),
        cap: btn.getAttribute('data-caption') || (image ? image.alt : '')
      };
    });

    var index = 0;

    function render() {
      var item = data[index];
      if (!img || !caption || !count) return;
      img.src = item.src;
      img.alt = item.cap;
      caption.textContent = item.cap;
      count.textContent = (index + 1) + ' / ' + data.length;
    }

    function open(n) {
      index = n;
      render();
      lb.classList.add('is-open');
      lb.setAttribute('aria-hidden', 'false');
      body.classList.add('no-scroll');
    }

    function close() {
      lb.classList.remove('is-open');
      lb.setAttribute('aria-hidden', 'true');
      body.classList.remove('no-scroll');
    }

    function prev() { index = (index - 1 + data.length) % data.length; render(); }
    function nxt() { index = (index + 1) % data.length; render(); }

    items.forEach(function (btn, i) {
      btn.addEventListener('click', function () { open(i); });
    });

    var closeBtn = $('.lightbox__close', lb);
    var prevBtn = $('.lightbox__nav--prev', lb);
    var nextBtn = $('.lightbox__nav--next', lb);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (prevBtn) prevBtn.addEventListener('click', prev);
    if (nextBtn) nextBtn.addEventListener('click', nxt);

    lb.addEventListener('click', function (e) {
      if (e.target === lb) close();
    });

    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') nxt();
    });
  })();

  /* ============================================================
     BOOKING FORM — mask, validation, loading, inline success
     ============================================================ */
  (function bookingForm() {
    var form = $('#bookingForm');
    var success = $('#formSuccess');
    if (!form || !success) return;

    var nameInput = $('#bkName');
    var phoneInput = $('#bkPhone');
    var dateInput = $('#bkDate');

    /* date: min = today */
    if (dateInput) {
      var now = new Date();
      var iso = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0');
      dateInput.setAttribute('min', iso);
    }

    /* phone mask: +7 (XXX) XXX-XX-XX */
    if (phoneInput) {
      phoneInput.addEventListener('input', function () {
        var digits = phoneInput.value.replace(/\D/g, '');
        if (digits.charAt(0) === '8') digits = '7' + digits.slice(1);
        if (digits.charAt(0) !== '7') digits = '7' + digits;
        digits = digits.slice(0, 11);

        var out = '+7';
        if (digits.length >= 2) out += ' (' + digits.slice(1, 4);
        if (digits.length >= 5) out += ') ' + digits.slice(4, 7);
        if (digits.length >= 8) out += '-' + digits.slice(7, 9);
        if (digits.length >= 10) out += '-' + digits.slice(9, 11);
        phoneInput.value = out;
      });
    }

    function setError(input, message) {
      var field = input ? input.closest('.field') : null;
      if (!field) return;
      var error = $('.field__error', field);
      if (message) {
        field.classList.add('is-error');
        if (error) error.textContent = message;
      } else {
        field.classList.remove('is-error');
        if (error) error.textContent = '';
      }
    }

    [nameInput, phoneInput, dateInput].forEach(function (input) {
      if (!input) return;
      input.addEventListener('input', function () { setError(input, ''); });
      input.addEventListener('change', function () { setError(input, ''); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var valid = true;
      var firstInvalid = null;

      /* name ≥ 2 chars */
      var nameVal = nameInput ? nameInput.value.trim() : '';
      if (nameVal.length < 2) {
        setError(nameInput, 'Введите имя — минимум 2 символа');
        valid = false;
        firstInvalid = firstInvalid || nameInput;
      }

      /* phone: exactly 11 digits */
      var digits = phoneInput ? (phoneInput.value.match(/\d/g) || []).length : 0;
      if (digits !== 11) {
        setError(phoneInput, 'Введите корректный номер телефона');
        valid = false;
        firstInvalid = firstInvalid || phoneInput;
      }

      /* date: filled and not in the past */
      if (dateInput) {
        var dateVal = dateInput.value;
        var minVal = dateInput.getAttribute('min') || '';
        if (!dateVal || (minVal && dateVal < minVal)) {
          setError(dateInput, !dateVal ? 'Выберите дату визита' : 'Дата уже прошла — выберите будущую');
          valid = false;
          firstInvalid = firstInvalid || dateInput;
        }
      }

      if (!valid) {
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      /* loading → inline success */
      var submitBtn = $('.form__submit', form);
      if (submitBtn) {
        submitBtn.classList.add('is-loading');
        submitBtn.setAttribute('disabled', 'disabled');
      }

      window.setTimeout(function () {
        form.hidden = true;
        success.hidden = false;
        window.requestAnimationFrame(function () {
          success.classList.add('is-visible');
        });
      }, reducedMotion ? 250 : 1400);
    });
  })();

  /* ============================================================
     BACK TO TOP
     ============================================================ */
  (function backToTop() {
    if (!toTop) return;
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    });
  })();

  /* ---------- init ---------- */
  measureParallax();
  onScrollFrame();
  window.addEventListener('load', function () {
    measureParallax();
    onScrollFrame();
  });

})();
