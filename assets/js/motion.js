/* ==========================================================
   动态引擎 MOTION —— 光场粒子 / 滚动进度 / 视差入场 /
   数字滚动 / 卡片聚光 / 涟漪 / 页面转场
   ========================================================== */
(function () {
  'use strict';
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var accent = '#5b8cff', accent2 = '#25d8ee';

  function readAccent() {
    var cs = getComputedStyle(document.documentElement);
    accent = (cs.getPropertyValue('--accent') || '#5b8cff').trim() || '#5b8cff';
    accent2 = (cs.getPropertyValue('--accent2') || '#25d8ee').trim() || '#25d8ee';
  }

  /* ---------- 画布光场粒子 ---------- */
  var canvas, ctx, W = 0, H = 0, dpr = 1, parts = [], raf = null, t0 = 0;
  function initCanvas() {
    if (reduced) return;
    canvas = document.getElementById('fx');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'fx';
      document.body.insertBefore(canvas, document.body.firstChild);
    }
    ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) { canvas.style.display = 'none'; return; }
    resize();
    window.addEventListener('resize', resize);
    var n = Math.min(74, Math.max(34, Math.round(window.innerWidth / 24)));
    parts = [];
    for (var i = 0; i < n; i++) {
      parts.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - .5) * .28, vy: (Math.random() - .5) * .28,
        r: 1 + Math.random() * 2.4, p: Math.random() * Math.PI * 2
      });
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { if (raf) cancelAnimationFrame(raf), raf = null; }
      else if (!raf) { t0 = performance.now(); raf = requestAnimationFrame(loop); }
    });
    t0 = performance.now();
    raf = requestAnimationFrame(loop);
  }
  function resize() {
    if (!canvas) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = canvas.width = Math.floor(window.innerWidth * dpr);
    H = canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    var t = (now - t0) / 1000;
    ctx.clearRect(0, 0, W, H);
    var dark = document.documentElement.getAttribute('data-theme') !== 'light';
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      p.x += p.vx * dpr; p.y += p.vy * dpr;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      var a = .22 + .22 * Math.sin(t * .8 + p.p);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * dpr, 0, 6.2832);
      ctx.fillStyle = (i % 3 === 0 ? accent2 : accent);
      ctx.globalAlpha = dark ? a : a * .55;
      ctx.fill();
    }
    // 邻近连线
    ctx.globalAlpha = dark ? .1 : .07;
    ctx.lineWidth = dpr * .6;
    for (var m = 0; m < parts.length; m++) {
      for (var k = m + 1; k < parts.length; k++) {
        var dx = parts[m].x - parts[k].x, dy = parts[m].y - parts[k].y;
        var d2 = dx * dx + dy * dy;
        if (d2 < 20000 * dpr * dpr) {
          ctx.strokeStyle = accent;
          ctx.beginPath();
          ctx.moveTo(parts[m].x, parts[m].y);
          ctx.lineTo(parts[k].x, parts[k].y);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- 滚动进度 ---------- */
  function initScrollProg() {
    var el = document.getElementById('scrollProg');
    if (!el) {
      el = document.createElement('div');
      el.id = 'scrollProg';
      document.body.appendChild(el);
    }
    function upd() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
      el.style.transform = 'scaleX(' + p + ')';
    }
    window.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd);
    upd();
  }

  /* ---------- 光标光晕 ---------- */
  function initCursor() {
    if (reduced || window.innerWidth < 900) return;
    var g = document.createElement('div');
    g.className = 'cursor-glow';
    document.body.appendChild(g);
    var x = 0, y = 0, cx = 0, cy = 0, on = false;
    window.addEventListener('mousemove', function (e) {
      x = e.clientX; y = e.clientY;
      if (!on) { on = true; g.classList.add('on'); }
    });
    (function tick() {
      cx += (x - cx) * .12; cy += (y - cy) * .12;
      g.style.transform = 'translate(' + cx + 'px,' + cy + 'px) translate(-50%,-50%)';
      requestAnimationFrame(tick);
    })();
  }

  /* ---------- 入场（含错峰） ---------- */
  var io = null;
  function initReveal() {
    if (!('IntersectionObserver' in window)) {
      $$('.reveal').forEach(function (n) { n.classList.add('in'); });
      return;
    }
    if (!io) {
      io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          var el = e.target;
          var sibs = Array.prototype.slice.call(el.parentNode ? el.parentNode.children : []);
          var idx = sibs.filter(function (x) { return x.classList && x.classList.contains('reveal'); }).indexOf(el);
          el.style.transitionDelay = Math.min(360, Math.max(0, idx) * 65) + 'ms';
          el.classList.add('in');
          io.unobserve(el);
        });
      }, { rootMargin: '0px 0px -6% 0px', threshold: .05 });
    }
    $$('.reveal:not(.in)').forEach(function (n) { io.observe(n); });
    // 兜底：跳转滚动时被「跳过」的元素也要显示
    if (!initReveal.bound) {
      initReveal.bound = 1;
      var sweep = function () {
        var vh = window.innerHeight;
        $$('.reveal:not(.in)').forEach(function (n) {
          var r = n.getBoundingClientRect();
          if (r.top < vh * 0.96) n.classList.add('in');
        });
      };
      window.addEventListener('scroll', sweep, { passive: true });
      window.addEventListener('resize', sweep);
      setTimeout(sweep, 1500);
    }
  }

  /* ---------- 数字滚动 ---------- */
  function initCounters() {
    $$('.stat .v, .hubstat .stat .v, [data-count]').forEach(function (el) {
      if (el.dataset.counted) return;
      var raw = String(el.textContent).trim();
      var m = raw.match(/^(\D*)(\d+(?:\.\d+)?)(.*)$/);
      if (!m) return;
      el.dataset.counted = '1';
      var pre = m[1], target = parseFloat(m[2]), post = m[3];
      if (reduced) return;
      var start = performance.now(), dur = 900;
      (function step(now) {
        var p = Math.min(1, (now - start) / dur);
        var v = target * (1 - Math.pow(1 - p, 3));
        el.textContent = pre + (target % 1 ? v.toFixed(1) : Math.round(v)) + post;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = raw;
      })(start);
    });
  }

  /* ---------- 卡片聚光 / 倾斜 ---------- */
  function initTilt() {
    if (reduced) return;
    $$('.kcard, .subcard, .dashcard, .ckcard, .module').forEach(function (c) {
      if (c.dataset.tilt) return;
      c.dataset.tilt = '1';
      c.addEventListener('mousemove', function (e) {
        var r = c.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        c.style.setProperty('--mx', (px * 100) + '%');
        c.style.setProperty('--my', (py * 100) + '%');
      });
    });
  }

  /* ---------- 涟漪 ---------- */
  function initRipple() {
    document.addEventListener('pointerdown', function (e) {
      var b = e.target.closest('.btn, .opt, .sptab, .tagchip, .sec-link, .navtabs a');
      if (!b || reduced) return;
      var r = b.getBoundingClientRect();
      var d = Math.max(r.width, r.height);
      var s = document.createElement('span');
      s.className = 'ripple';
      s.style.width = s.style.height = d + 'px';
      s.style.left = (e.clientX - r.left - d / 2) + 'px';
      s.style.top = (e.clientY - r.top - d / 2) + 'px';
      if (getComputedStyle(b).position === 'static') b.style.position = 'relative';
      b.appendChild(s);
      setTimeout(function () { s.remove(); }, 620);
    });
  }

  /* ---------- 页面转场 ---------- */
  function initTransitions() {
    var native = !!(window.CSS && CSS.supports && CSS.supports('view-transition-name: none'));
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || a.target === '_blank') return;
      if (/^(https?:|mailto:|tel:)/i.test(href)) return;
      if (!/\.html/.test(href)) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      var r = a.getBoundingClientRect();
      var vx = (r.left + r.width / 2), vy = (r.top + r.height / 2);
      document.documentElement.style.setProperty('--vx', vx + 'px');
      document.documentElement.style.setProperty('--vy', vy + 'px');
      if (native || reduced) { location.href = href; return; }
      var veil = document.querySelector('.vt-veil');
      if (!veil) { veil = document.createElement('div'); veil.className = 'vt-veil'; document.body.appendChild(veil); }
      veil.classList.remove('run');
      void veil.offsetWidth;
      veil.classList.add('run');
      setTimeout(function () { location.href = href; }, 300);
    });
  }

  /* ---------- 主题切换时重读主色 ---------- */
  function watchAccent() {
    readAccent();
    if (window.MutationObserver) {
      new MutationObserver(readAccent).observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'data-theme'] });
    }
  }

  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  window.MOTION = {
    refresh: function () {
      readAccent();
      initReveal();
      initCounters();
      initTilt();
    },
    start: function () {
      readAccent();
      initCanvas();
      initScrollProg();
      initCursor();
      initRipple();
      initTransitions();
      watchAccent();
      initReveal();
      initCounters();
      initTilt();
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', window.MOTION.start);
  else window.MOTION.start();
})();
