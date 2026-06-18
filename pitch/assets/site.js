/* Posėdis docs — shared backdrop + scroll behaviour (mirrors presentation.html) */

/* ---------------- starfield ---------------- */
(function () {
  const c = document.getElementById('starfield');
  if (!c) return;
  const x = c.getContext('2d');
  let w, h, stars, dpr = Math.min(window.devicePixelRatio || 1, 2);
  function resize() {
    w = c.width = innerWidth * dpr; h = c.height = innerHeight * dpr;
    c.style.width = innerWidth + 'px'; c.style.height = innerHeight + 'px';
    const n = Math.min(160, Math.floor(innerWidth / 11));
    stars = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      z: Math.random() * 0.8 + 0.2, r: Math.random() * 1.3 + 0.3,
      tw: Math.random() * Math.PI * 2
    }));
  }
  let scrollY = 0;
  addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });
  resize(); addEventListener('resize', resize);
  function draw(t) {
    x.clearRect(0, 0, w, h);
    for (const s of stars) {
      const off = scrollY * dpr * s.z * 0.2;
      let y = (s.y - off) % h; if (y < 0) y += h;
      const a = 0.35 + 0.55 * Math.abs(Math.sin(t * 0.001 + s.tw));
      x.beginPath();
      x.fillStyle = s.z > 0.75 ? `rgba(230,181,74,${a * 0.85})` : `rgba(220,228,245,${a * 0.6})`;
      x.arc(s.x, y, s.r * s.z * dpr, 0, Math.PI * 2); x.fill();
    }
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();

/* ---------------- scroll progress bar ---------------- */
(function () {
  const bar = document.getElementById('scrollbar');
  if (!bar) return;
  function update() {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + '%';
  }
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update); update();
})();

/* ---------------- reveal on scroll ---------------- */
(function () {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    els.forEach(e => { e.style.opacity = 1; e.style.transform = 'none'; });
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.style.transition = 'opacity .8s cubic-bezier(.2,.8,.2,1), transform .8s cubic-bezier(.2,.8,.2,1)';
        en.target.style.opacity = 1; en.target.style.transform = 'none';
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(e => io.observe(e));
})();

/* ---------------- TOC scrollspy ---------------- */
(function () {
  const links = Array.from(document.querySelectorAll('.toc a[href^="#"]'));
  if (!links.length) return;
  const map = new Map();
  links.forEach(l => { const t = document.querySelector(l.getAttribute('href')); if (t) map.set(t, l); });
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const active = map.get(en.target);
        if (active) active.classList.add('active');
      }
    });
  }, { rootMargin: '-80px 0px -65% 0px', threshold: 0 });
  map.forEach((_l, sec) => io.observe(sec));
})();
