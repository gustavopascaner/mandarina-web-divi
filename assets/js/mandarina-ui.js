/* Mandarina · interacciones de interfaz (sin dependencias) */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* Header sólido al scrollear + menú mobile */
  var header = document.querySelector('.mnd-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-solid', scrollY > 40); };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    var burger = header.querySelector('.mnd-burger');
    burger && burger.addEventListener('click', function () {
      var open = !header.classList.contains('is-open');
      header.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open);
    });
    header.querySelectorAll('.mnd-nav a').forEach(function (a) {
      a.addEventListener('click', function () { header.classList.remove('is-open'); });
    });
  }

  /* Aparición al scrollear */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      io.unobserve(en.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  document.querySelectorAll('.mnd [data-reveal]').forEach(function (el) { io.observe(el); });

  /* Chat de ejemplo: las burbujas entran de a una */
  document.querySelectorAll('.mnd-chat').forEach(function (chat) {
    var bubbles = chat.querySelectorAll('.mnd-bubble');
    new IntersectionObserver(function (entries, obs) {
      if (!entries[0].isIntersecting) return;
      obs.disconnect();
      bubbles.forEach(function (b, i) { setTimeout(function () { b.classList.add('is-in'); }, reduce ? 0 : 350 + i * 750); });
    }, { threshold: 0.4 }).observe(chat);
  });

  /* Tarjetas: inclinación 3D + luz que sigue al mouse */
  if (fine && !reduce) {
    document.querySelectorAll('.mnd-card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var b = card.getBoundingClientRect();
        var x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
        card.style.setProperty('--x', x * 100 + '%');
        card.style.setProperty('--y', y * 100 + '%');
        card.style.transform = 'rotateX(' + (0.5 - y) * 10 + 'deg) rotateY(' + (x - 0.5) * 12 + 'deg) translateZ(0)';
      });
      card.addEventListener('pointerleave', function () { card.style.transform = ''; });
    });
  }

  /* Botones: brillo bajo el puntero + leve efecto imán */
  document.querySelectorAll('.mnd-btn').forEach(function (btn) {
    btn.addEventListener('pointermove', function (e) {
      var b = btn.getBoundingClientRect();
      btn.style.setProperty('--x', e.clientX - b.left + 'px');
      btn.style.setProperty('--y', e.clientY - b.top + 'px');
      if (fine && !reduce) {
        btn.style.translate = ((e.clientX - b.left) / b.width - 0.5) * 8 + 'px ' + ((e.clientY - b.top) / b.height - 0.5) * 8 + 'px';
      }
    });
    btn.addEventListener('pointerleave', function () { btn.style.translate = ''; });
  });

  /* Proceso: qué paso se ve según el scroll */
  var track = document.querySelector('.mnd-process-track');
  if (track) {
    var steps = track.querySelectorAll('.mnd-step');
    var bars = track.querySelectorAll('.mnd-progress b');
    var onProc = function () {
      var b = track.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, -b.top / (b.height - innerHeight)));
      var n = steps.length, idx = Math.min(n - 1, Math.floor(p * n));
      steps.forEach(function (s, i) { s.classList.toggle('is-active', i === idx); });
      bars.forEach(function (bar, i) { bar.parentNode.style.setProperty('--p', Math.min(1, Math.max(0, p * n - i))); bar.style.setProperty('--p', Math.min(1, Math.max(0, p * n - i))); });
    };
    addEventListener('scroll', onProc, { passive: true });
    onProc();
  }

  /* Órbita de integraciones: radio según tamaño e inclinación con el mouse */
  var stage = document.querySelector('.mnd-orbit-stage');
  if (stage) {
    var orbit = stage.querySelector('.mnd-orbit');
    var setR = function () { orbit.style.setProperty('--r', orbit.offsetWidth / 2 + 'px'); };
    new ResizeObserver(setR).observe(orbit);
    setR();
    if (fine && !reduce) {
      stage.closest('section').addEventListener('pointermove', function (e) {
        var b = stage.getBoundingClientRect();
        var x = (e.clientX - b.left) / b.width - 0.5, y = (e.clientY - b.top) / b.height - 0.5;
        var rx = 64 - y * 30, ry = x * 30;
        orbit.style.setProperty('--rx', rx + 'deg');
        orbit.style.setProperty('--ry', ry + 'deg');
      });
    }
  }

  /* FAQ: abrir/cerrar con animación de alto */
  document.querySelectorAll('.mnd-faq details').forEach(function (d) {
    var sum = d.querySelector('summary'), body = d.querySelector('.mnd-answer');
    sum.addEventListener('click', function (e) {
      if (reduce || !body.animate) return;
      e.preventDefault();
      if (d.open) {
        var h = body.offsetHeight;
        body.animate({ height: [h + 'px', '0px'], opacity: [1, 0] }, { duration: 350, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = function () { d.open = false; };
      } else {
        d.open = true;
        var h2 = body.offsetHeight;
        body.animate({ height: ['0px', h2 + 'px'], opacity: [0, 1] }, { duration: 450, easing: 'cubic-bezier(.2,.8,.2,1)' });
      }
    });
  });

  /* Video: se carga YouTube recién al hacer clic (la página arranca más rápido) */
  document.querySelectorAll('.mnd-video-play').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + btn.dataset.yt + '?autoplay=1&rel=0&modestbranding=1';
      f.title = btn.getAttribute('aria-label');
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      f.allowFullscreen = true;
      btn.replaceWith(f);
    });
  });

  /* Halo del cursor */
  var halo = document.querySelector('.mnd-cursor');
  if (halo && fine && !reduce) {
    var hx = innerWidth / 2, hy = innerHeight / 2, cx = hx, cy = hy;
    addEventListener('pointermove', function (e) { hx = e.clientX; hy = e.clientY; }, { passive: true });
    (function tick() {
      cx += (hx - cx) * 0.12; cy += (hy - cy) * 0.12;
      halo.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
      requestAnimationFrame(tick);
    })();
  }

  /* CTA final: burbujas de jugo que suben */
  var cta = document.querySelector('[data-mnd-bubbles]');
  if (cta && !reduce) {
    var ctx = cta.getContext('2d'), W, H, parts = [], running = false;
    var size = function () {
      var dpr = Math.min(devicePixelRatio || 1, 2), b = cta.getBoundingClientRect();
      W = b.width; H = b.height; cta.width = W * dpr; cta.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    new ResizeObserver(size).observe(cta); size();
    for (var i = 0; i < 70; i++) parts.push({ x: Math.random(), y: Math.random(), r: 1 + Math.random() * 5, v: 0.0006 + Math.random() * 0.0018, w: Math.random() * 6.28 });
    var frame = function (ms) {
      ctx.clearRect(0, 0, W, H);
      parts.forEach(function (p) {
        p.y -= p.v; if (p.y < -0.05) { p.y = 1.05; p.x = Math.random(); }
        var x = (p.x + Math.sin(ms / 1400 + p.w) * 0.01) * W, y = p.y * H;
        var g = ctx.createRadialGradient(x, y, 0, x, y, p.r * 3);
        g.addColorStop(0, 'rgba(255,220,170,.9)'); g.addColorStop(1, 'rgba(255,115,0,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, p.r * 3, 0, 6.29); ctx.fill();
      });
      running && requestAnimationFrame(frame);
    };
    new IntersectionObserver(function (en) {
      var was = running; running = en[0].isIntersecting;
      if (running && !was) requestAnimationFrame(frame);
    }).observe(cta);
  }
})();
