/* ==========================================================
   全科知识库 · 数据来自 high-school-knowledge-hub（原样移植，未改动源仓库）
   六科 2408 个知识点：重点 / 难点 / 考点 + 讲解 / 例题 / 易错提醒
   ========================================================== */
(function () {
  'use strict';
  var S = window.STUDY;
  var esc = S.esc, LS = S.LS;

  var SUBS = [
    { id: 'chinese',  name: '语文', emoji: '📖', accent: '#ef6f6c' },
    { id: 'math',     name: '数学', emoji: '📐', accent: '#5b8cff' },
    { id: 'english',  name: '英语', emoji: '🔤', accent: '#34d399' },
    { id: 'physics',  name: '物理', emoji: '⚡', accent: '#a78bfa' },
    { id: 'chemistry',name: '化学', emoji: '🧪', accent: '#fbbf24' },
    { id: 'biology',  name: '生物', emoji: '🧬', accent: '#22d3ee' }
  ];
  var GROUPS = [
    { key: 'k', label: '重点', icon: '⭐', cls: 'g-key' },
    { key: 'd', label: '难点', icon: '🧩', cls: 'g-diff' },
    { key: 'e', label: '考点', icon: '🎯', cls: 'g-exam' }
  ];

  var cur = 'chinese';
  var mode = 'points';
  var query = '';
  var store = {};
  var master = {};
  var openPoint = {};
  var cache = {};

  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = function () { res(); };
      s.onerror = function () { rej(new Error('加载失败 ' + src)); };
      document.head.appendChild(s);
    });
  }
  function ensure(id) {
    if (cache[id]) return Promise.resolve(cache[id]);
    return Promise.all(['core', 'enrich', 'textbook', 'toc'].map(function (k) {
      return loadScript('assets/js/data/hub/' + id + '-' + k + '.js');
    })).then(function () {
      cache[id] = {
        core: window.HUB_CORE,
        enrich: window.HUB_ENRICH,
        textbook: window.HUB_TEXTBOOK,
        toc: window.HUB_TOC
      };
      return cache[id];
    });
  }

  function mkey(id) { return 'hub.master.' + id; }
  function pid(p, m, k, i) { return p + '|' + m + '|' + k + '|' + i; }
  function ptText(m, g, i) { return (m[g === 'k' ? 'keyPoints' : g === 'd' ? 'difficultPoints' : 'examPoints'] || [])[i] || ''; }

  function allPoints(d) {
    var out = [];
    d.core.periods.forEach(function (p, pi) {
      p.modules.forEach(function (m, mi) {
        GROUPS.forEach(function (g) {
          (m[g.key === 'k' ? 'keyPoints' : g.key === 'd' ? 'difficultPoints' : 'examPoints'] || []).forEach(function (t, i) {
            out.push({ id: pid(pi, mi, g.key, i), text: t, g: g, module: m.title, period: p.period, book: p.textbook });
          });
        });
      });
    });
    return out;
  }
  function progress(d) {
    var pts = allPoints(d), done = 0;
    pts.forEach(function (p) { var v = master[p.id] || 0; done += v === 2 ? 1 : v === 1 ? 0.5 : 0; });
    return { total: pts.length, score: done, pct: pts.length ? Math.round(done / pts.length * 100) : 0 };
  }

  function render() {
    var app = document.getElementById('app');
    var idx = SUBS.map(function (s) {
      return '<button class="sptab' + (s.id === cur ? ' on' : '') + '" data-sub="' + s.id + '" style="--c:' + s.accent + '">' + s.emoji + ' ' + s.name + '</button>';
    }).join('');
    app.innerHTML = S.topbar(null, 'hub') +
      '<main class="wrap">' +
        '<div class="hero" style="padding:44px 0 22px">' +
          '<h1>📚 <span class="grad">全科知识库</span></h1>' +
          '<p class="lead">来自 <b>high-school-knowledge-hub</b> 的 2408 个知识点：按「学段 → 模块 → 重点/难点/考点」组织，' +
          '每个知识点都带详细讲解、例题解析与易错提醒；左侧圆点可循环标记「未掌握 → 学习中 → 已掌握」。</p>' +
        '</div>' +
        '<div class="sptabs">' + idx + '</div>' +
        '<div class="hubbar">' +
          '<div class="modes">' +
            '<button class="btn' + (mode === 'points' ? ' primary' : '') + '" data-mode="points">🧠 知识点</button>' +
            '<button class="btn' + (mode === 'book' ? ' primary' : '') + '" data-mode="book">📖 电子课本</button>' +
          '</div>' +
          '<input id="hubSearch" placeholder="🔍 检索本学科知识点、讲解、例题…" value="' + esc(query) + '">' +
          '<button class="btn" id="hubRandom">🎲 随机复习</button>' +
        '</div>' +
        '<div id="hubBody"><div class="hubload">正在载入知识点…</div></div>' +
      '</main>' +
      '<button class="totop" id="toTop">↑</button>' +
      '<div id="hubModal" class="modal"><div class="modal-box" id="hubModalBox"></div></div>';
    S.afterRender();
    bind();
    paint();
  }

  function bind() {
    document.querySelectorAll('.sptab').forEach(function (b) {
      b.addEventListener('click', function () {
        cur = b.dataset.sub; query = ''; openPoint = {};
        document.querySelectorAll('.sptab').forEach(function (x) { x.classList.toggle('on', x === b); });
        master = LS.get(mkey(cur), {});
        document.getElementById('hubSearch').value = '';
        paint();
      });
    });
    document.querySelectorAll('[data-mode]').forEach(function (b) {
      b.addEventListener('click', function () {
        mode = b.dataset.mode;
        document.querySelectorAll('[data-mode]').forEach(function (x) { x.classList.toggle('primary', x === b); });
        openPoint = {};
        paint();
      });
    });
    var si = document.getElementById('hubSearch');
    var timer = null;
    si.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { query = si.value.trim().toLowerCase(); paint(); }, 180);
    });
    document.getElementById('hubRandom').addEventListener('click', function () { openRandom(); });
    document.getElementById('hubModal').addEventListener('click', function (e) {
      if (e.target.id === 'hubModal') e.target.classList.remove('show');
    });
  }

  function paint() {
    var body = document.getElementById('hubBody');
    body.innerHTML = '<div class="hubload">正在载入知识点…</div>';
    ensure(cur).then(function (d) {
      master = LS.get(mkey(cur), {});
      var pr = progress(d);
      var head = '<div class="hubstat">' +
        '<div class="stat"><div class="k">学段 / 册</div><div class="v">' + d.core.periods.length + '</div></div>' +
        '<div class="stat"><div class="k">知识模块</div><div class="v">' + d.core.periods.reduce(function (a, p) { return a + p.modules.length; }, 0) + '</div></div>' +
        '<div class="stat"><div class="k">知识点</div><div class="v">' + pr.total + '</div></div>' +
        '<div class="stat"><div class="k">掌握度</div><div class="v">' + pr.pct + '%</div></div>' +
        '</div>' +
        '<div class="progwrap"><div class="progbar"><i style="width:' + pr.pct + '%"></i></div>' +
        '<span class="proglabel">已掌握 ' + (Math.round(pr.score * 10) / 10) + ' / ' + pr.total + '</span></div>' +
        '<p class="sec-sub">' + esc(d.core.intro || '') + '</p>';
      body.innerHTML = head + (mode === 'points' ? pointsHTML(d) : bookHTML(d));
      wirePoints();
    }).catch(function (e) {
      body.innerHTML = '<div class="hubload">载入失败：' + esc(e.message) + '（请用本地服务器打开本站，例如 node tools/serve.cjs 8123）</div>';
    });
  }

  function pointsHTML(d) {
    var html = '', shown = 0;
    d.core.periods.forEach(function (p, pi) {
      var mods = '';
      p.modules.forEach(function (m, mi) {
        var groups = '';
        GROUPS.forEach(function (g) {
          var arr = g.key === 'k' ? (m.keyPoints || []) : g.key === 'd' ? (m.difficultPoints || []) : (m.examPoints || []);
          var items = '';
          arr.forEach(function (t, i) {
            var id = pid(pi, mi, g.key, i);
            var e = d.enrich[id] || {};
            if (query) {
              var hay = (t + ' ' + (e.explain || '') + ' ' + (e.example || '') + ' ' + (e.tip || '')).toLowerCase();
              if (hay.indexOf(query) < 0) return;
            }
            shown++;
            var lv = master[id] || 0;
            var open = openPoint[id];
            items += '<div class="pt' + (open ? ' open' : '') + '" data-pid="' + id + '">' +
              '<button class="dot lv' + lv + '" data-lv="' + lv + '" title="点击切换掌握程度"></button>' +
              '<div class="pt-body"><p class="pt-text">' + esc(t) + '</p>' +
              (open ? '<div class="pt-detail">' +
                (e.explain ? '<p><b>📖 讲解：</b>' + esc(e.explain) + '</p>' : '') +
                (e.example ? '<p><b>✏️ 例题：</b>' + esc(e.example) + '</p>' : '') +
                (e.tip ? '<p><b>⚠️ 易错：</b>' + esc(e.tip) + '</p>' : '') +
                (!e.explain && !e.example && !e.tip ? '<p>暂无讲解。</p>' : '') +
                '</div>' : '') +
              '</div></div>';
          });
          if (items) groups += '<div class="pgroup ' + g.cls + '"><h4>' + g.icon + ' ' + g.label + '</h4><div class="plist">' + items + '</div></div>';
        });
        if (mods !== null && groups) {
          mods += '<article class="module"><h3><span>' + esc(m.title) + '</span><em>' + esc(p.period) + ' · ' + esc(p.textbook) + '</em></h3>' + groups + '</article>';
        }
      });
      var tips = (p.tips || []).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');
      html += '<section class="period"><div class="period-head"><span class="pdot"></span><h2>' + esc(p.period) + '</h2>' +
        '<span class="pbook">' + esc(p.textbook) + '</span></div>' +
        (tips ? '<ul class="ptips">' + tips + '</ul>' : '') + mods + '</section>';
    });
    if (!html) return '<div class="hubload">没有匹配的知识点，换个关键词试试。</div>';
    return (query ? '<p class="sec-sub">🔍 命中 <b>' + shown + '</b> 条知识点</p>' : '') + html;
  }

  function bookHTML(d) {
    var books = d.toc;
    var arr = Array.isArray(books) ? books : Object.keys(books).map(function (k) { return books[k]; }).reduce(function (a, b) { return a.concat(b); }, []);
    return arr.map(function (bk) {
      var units = (bk.units || []).map(function (u) {
        var secs = (u.sections || []).map(function (sc) {
          return '<button class="sec-link" data-mod="' + esc(sc.module) + '">' + esc(sc.sec) + '</button>';
        }).join('');
        return '<div class="tunit"><h4>' + esc(u.unit) + '</h4><div class="seclist">' + secs + '</div></div>';
      }).join('');
      return '<article class="module"><h3><span>📘 ' + esc(bk.book) + '</span></h3>' + units + '</article>';
    }).join('');
  }

  function wirePoints() {
    document.querySelectorAll('.pt').forEach(function (row) {
      row.addEventListener('click', function (e) {
        if (e.target.classList.contains('dot')) return;
        var id = row.dataset.pid;
        openPoint[id] = !openPoint[id];
        paint();
      });
    });
    document.querySelectorAll('.dot').forEach(function (dot) {
      dot.addEventListener('click', function (e) {
        e.stopPropagation();
        var row = dot.closest('.pt');
        var id = row.dataset.pid;
        var lv = (master[id] || 0);
        lv = lv >= 2 ? 0 : lv + 1;
        master[id] = lv;
        LS.set(mkey(cur), master);
        dot.className = 'dot lv' + lv;
        dot.dataset.lv = lv;
        var d = cache[cur];
        var pr = progress(d);
        var bar = document.querySelector('.progwrap .progbar i');
        if (bar) bar.style.width = pr.pct + '%';
        var lab = document.querySelector('.progwrap .proglabel');
        if (lab) lab.textContent = '已掌握 ' + (Math.round(pr.score * 10) / 10) + ' / ' + pr.total;
      });
    });
    document.querySelectorAll('.sec-link').forEach(function (b) {
      b.addEventListener('click', function () {
        var mod = b.dataset.mod;
        mode = 'points'; openPoint = {};
        document.querySelectorAll('[data-mode]').forEach(function (x) { x.classList.toggle('primary', x.dataset.mode === 'points'); });
        paint();
        setTimeout(function () {
          var cards = document.querySelectorAll('.module');
          if (cards.length) cards[Math.min(parseInt(mod.split('|')[1], 10) || 0, cards.length - 1)].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 120);
      });
    });
  }

  function openRandom() {
    ensure(cur).then(function (d) {
      var pts = allPoints(d);
      if (!pts.length) return;
      var p = pts[Math.floor(Math.random() * pts.length)];
      var e = d.enrich[p.id] || {};
      var box = document.getElementById('hubModalBox');
      box.innerHTML = '<button class="modal-x" id="hubX">✕</button>' +
        '<span class="pill">' + p.g.icon + ' ' + p.g.label + ' · ' + esc(p.module) + '</span>' +
        '<h3 style="margin:14px 0 10px">' + esc(p.text) + '</h3>' +
        (e.explain ? '<p><b>📖 讲解：</b>' + esc(e.explain) + '</p>' : '') +
        (e.example ? '<p><b>✏️ 例题：</b>' + esc(e.example) + '</p>' : '') +
        (e.tip ? '<p><b>⚠️ 易错：</b>' + esc(e.tip) + '</p>' : '') +
        '<div class="fcmeta" style="margin-top:16px"><span class="fccounter">' + esc(p.period) + ' · ' + esc(p.book) + '</span>' +
        '<button class="btn primary" id="hubAgain">🎲 再来一条</button></div>';
      document.getElementById('hubModal').classList.add('show');
      document.getElementById('hubX').addEventListener('click', function () { document.getElementById('hubModal').classList.remove('show'); });
      document.getElementById('hubAgain').addEventListener('click', openRandom);
    });
  }

  render();
})();
