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
    if (reduced || window.innerWidth < 820) return;
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
    var n = Math.min(44, Math.max(20, Math.round(window.innerWidth / 44)));
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
    dpr = Math.min(1.5, window.devicePixelRatio || 1);
    W = canvas.width = Math.floor(window.innerWidth * dpr);
    H = canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
  }
  var lastDraw = 0, frameAcc = 0, frameCount = 0, degraded = false;
  function loop(now) {
    if (degraded) return;
    raf = requestAnimationFrame(loop);
    if (now - lastDraw < 33) return;                 // 最高 30fps
    var dt = now - lastDraw; lastDraw = now;
    frameAcc += dt; frameCount++;
    if (frameCount >= 45) {
      if (frameAcc / frameCount > 90) {              // 整机帧率过低 → 自动关闭光场
        degraded = true; canvas.style.display = 'none';
        if (raf) cancelAnimationFrame(raf); raf = null; return;
      }
      frameAcc = 0; frameCount = 0;
    }
    ctx.clearRect(0, 0, W, H);
    var dark = document.documentElement.getAttribute('data-theme') !== 'light';
    ctx.globalAlpha = dark ? .3 : .16;
    var link = 18000 * dpr * dpr;
    // 连线：全部并成一条路径，一次描边
    ctx.strokeStyle = accent;
    ctx.lineWidth = dpr * .6;
    ctx.beginPath();
    for (var m = 0; m < parts.length; m++) {
      var pm = parts[m];
      for (var k = m + 1; k < parts.length; k++) {
        var dx = pm.x - parts[k].x, dy = pm.y - parts[k].y;
        if (dx * dx + dy * dy < link) { ctx.moveTo(pm.x, pm.y); ctx.lineTo(parts[k].x, parts[k].y); }
      }
    }
    ctx.stroke();
    // 粒子：按颜色分两组批量填充
    for (var g = 0; g < 2; g++) {
      ctx.fillStyle = g ? accent2 : accent;
      ctx.beginPath();
      for (var i = g; i < parts.length; i += 2) {
        var p = parts[i];
        p.x += p.vx * dpr; p.y += p.vy * dpr;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.moveTo(p.x + p.r * dpr, p.y);
        ctx.arc(p.x, p.y, p.r * dpr, 0, 6.2832);
      }
      ctx.fill();
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
      var sweepRaf = 0;
      var sweep = function () {
        if (sweepRaf) return;
        sweepRaf = requestAnimationFrame(function () {
          sweepRaf = 0;
          var list = $$('.reveal:not(.in)');
          if (!list.length) return;
          var vh = window.innerHeight;
          for (var i = 0; i < list.length; i++) {
            if (list[i].getBoundingClientRect().top < vh * 0.96) list[i].classList.add('in');
          }
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
    if (reduced || initTilt.bound) return;
    initTilt.bound = 1;
    var cur = null, raf = 0, mx = 0, my = 0;
    document.addEventListener('mousemove', function (e) {
      var el = e.target && e.target.closest ? e.target.closest('.kcard, .subcard, .dashcard, .ckcard, .module') : null;
      if (el !== cur) {
        if (cur) { cur.style.removeProperty('--mx'); cur.style.removeProperty('--my'); }
        cur = el;
      }
      if (!cur || raf) return;
      mx = e.clientX; my = e.clientY;
      raf = requestAnimationFrame(function () {
        raf = 0;
        if (!cur) return;
        var r = cur.getBoundingClientRect();
        cur.style.setProperty('--mx', ((mx - r.left) / r.width * 100) + '%');
        cur.style.setProperty('--my', ((my - r.top) / r.height * 100) + '%');
      });
    }, { passive: true });
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
      // 低性能模式：手动保存过就听保存的，否则按设备能力自动判断
      var stored = null;
      try { stored = JSON.parse(localStorage.getItem('study.lite')); } catch (e) {}
      var lowEnd = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
      window.MOTION.setLite(stored === true || (stored === null && lowEnd));
    },
    setLite: function (v) {
      v = !!v;
      document.documentElement.classList.toggle('lite', v);
      if (v) {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        if (canvas) canvas.style.display = 'none';
      } else if (canvas && !degraded) {
        canvas.style.display = '';
        lastDraw = 0; t0 = performance.now();
        if (!raf) raf = requestAnimationFrame(loop);
      }
      var b = document.getElementById('perfBtn');
      if (b) {
        b.textContent = v ? '🌿' : '⚡';
        b.title = v ? '当前：低性能模式（点击开启背景动效）' : '当前：动态模式（点击关闭背景动效省电）';
      }
      var tb = document.getElementById('perfTip');
      if (tb) tb.remove();
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', window.MOTION.start);
  else window.MOTION.start();
})();
