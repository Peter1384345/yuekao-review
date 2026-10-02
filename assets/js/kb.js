/* ==========================================================
   分科页融合层 KB —— 把 high-school-knowledge-hub 的知识点
   与 gao2 的知识导图按「学科」就地嵌进分科页面
   ========================================================== */
(function () {
  'use strict';
  var S = window.STUDY;
  var esc = S.esc, LS = S.LS;
  var GROUPS = [
    { key: 'k', label: '重点', icon: '⭐', cls: 'g-key' },
    { key: 'd', label: '难点', icon: '🧩', cls: 'g-diff' },
    { key: 'e', label: '考点', icon: '🎯', cls: 'g-exam' }
  ];
  var MAPKEY = { chinese: 'yuwen', math: 'shuxue', english: 'yingyu', physics: 'wuli', chemistry: 'huaxue', biology: 'shengwu' };
  var cache = {}, opened = false, master = {}, query = '';

  function load(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src; s.onload = function () { res(); }; s.onerror = function () { rej(new Error(src)); };
      document.head.appendChild(s);
    });
  }
  function ensure(id) {
    if (cache[id]) return Promise.resolve(cache[id]);
    return Promise.all(['core', 'enrich', 'textbook', 'toc'].map(function (k) {
      return load('../assets/js/data/hub/' + id + '-' + k + '.js');
    })).then(function () {
      cache[id] = { core: window.HUB_CORE, enrich: window.HUB_ENRICH, textbook: window.HUB_TEXTBOOK, toc: window.HUB_TOC };
      return cache[id];
    });
  }
  function pid(p, m, k, i) { return p + '|' + m + '|' + k + '|' + i; }
  function allPoints(d) {
    var out = [];
    d.core.periods.forEach(function (p, pi) {
      p.modules.forEach(function (m, mi) {
        GROUPS.forEach(function (g) {
          var arr = g.key === 'k' ? (m.keyPoints || []) : g.key === 'd' ? (m.difficultPoints || []) : (m.examPoints || []);
          arr.forEach(function (t, i) { out.push({ id: pid(pi, mi, g.key, i), text: t, g: g, module: m.title }); });
        });
      });
    });
    return out;
  }
  function prog(d) {
    var pts = allPoints(d), n = 0;
    pts.forEach(function (p) { var v = master[p.id] || 0; n += v === 2 ? 1 : v === 1 ? .5 : 0; });
    return { total: pts.length, score: Math.round(n * 10) / 10, pct: pts.length ? Math.round(n / pts.length * 100) : 0 };
  }

  function html(id) {
    return '<section class="block reveal" id="kb">' +
      '<div class="sec-head"><span class="ic">📚</span><h2>本科知识库 · 深挖版</h2></div>' +
      '<p class="sec-sub">来自 <b>high-school-knowledge-hub</b> 的全量知识点已按本科目就地融合：' +
      '每一条都带详细讲解、例题解析与易错提醒，左侧圆点可标记掌握程度（与知识库页面进度互通）。</p>' +
      '<div class="fusion">' +
        '<div class="fusion-head">' +
          '<span class="tagline" data-kb-stat>尚未展开</span>' +
          '<button class="btn primary" data-kb-toggle>展开本科知识库</button>' +
          '<a class="btn" href="../hub.html?subject=' + id + '">跨科检索 / 电子课本 →</a>' +
        '</div>' +
        '<p class="closehint" data-kb-hint>点右侧按钮按需加载，不展开就不会下载数据，页面更轻快。</p>' +
        '<div class="kbmini" data-kb-mini></div>' +
      '</div>' +
    '</section>';
  }

  function renderMini(id, d) {
    var pr = prog(d), shown = 0;
    var out = '<div class="hubstat" style="margin-top:6px">' +
      '<div class="stat"><div class="k">学段 / 册</div><div class="v">' + d.core.periods.length + '</div></div>' +
      '<div class="stat"><div class="k">知识模块</div><div class="v">' + d.core.periods.reduce(function (a, p) { return a + p.modules.length; }, 0) + '</div></div>' +
      '<div class="stat"><div class="k">知识点</div><div class="v">' + pr.total + '</div></div>' +
      '<div class="stat"><div class="k">掌握度</div><div class="v">' + pr.pct + '%</div></div>' +
      '</div>' +
      '<div class="progwrap"><div class="progbar"><i style="width:' + pr.pct + '%"></i></div>' +
      '<span class="proglabel">已掌握 ' + pr.score + ' / ' + pr.total + '</span></div>' +
      '<div class="searchbar"><input data-kb-search placeholder="🔍 在本科知识点里检索（含讲解与例题）"></div>';

    // 本科知识导图
    var M = window.SPRINT_MAP;
    var mk = MAPKEY[id];
    if (M && M.data && M.data[mk]) {
      var tips = M.tips || {};
      function node(n, depth) {
        var kids = n.children || [];
        var tip = tips[n.name];
        return '<li class="mn d' + depth + '">' +
          '<span class="mn-t' + (kids.length ? ' has' : '') + '"' + (tip ? ' data-tip="' + esc(tip) + '"' : '') + '>' +
          (kids.length ? '<i class="caret">▸</i>' : '<i class="leaf">•</i>') + esc(n.name) + (tip ? ' <em>💡</em>' : '') + '</span>' +
          (kids.length ? '<ul class="mn-kids">' + kids.map(function (c) { return node(c, depth + 1); }).join('') + '</ul>' : '') + '</li>';
      }
      out += '<h3 style="margin:22px 0 10px;font-size:16px">🧭 本科知识导图</h3>' +
        '<div class="mapbox" data-kb-map><ul class="mtree">' + node(M.data[mk], 0) + '</ul></div>';
    }

    out += '<h3 style="margin:22px 0 10px;font-size:16px">📖 全量知识点（按册 → 模块）</h3>';
    d.core.periods.forEach(function (p, pi) {
      var mods = '';
      p.modules.forEach(function (m, mi) {
        var groupsHTML = '';
        GROUPS.forEach(function (g) {
          var arr = g.key === 'k' ? (m.keyPoints || []) : g.key === 'd' ? (m.difficultPoints || []) : (m.examPoints || []);
          var items = '';
          arr.forEach(function (t, i) {
            var idp = pid(pi, mi, g.key, i);
            var e = d.enrich[idp] || {};
            if (query) {
              var hay = (t + ' ' + (e.explain || '') + ' ' + (e.example || '') + ' ' + (e.tip || '')).toLowerCase();
              if (hay.indexOf(query) < 0) return;
            }
            shown++;
            var lv = master[idp] || 0;
            items += '<div class="pt" data-pid="' + idp + '">' +
              '<button class="dot lv' + lv + '" data-id="' + idp + '" title="点击切换掌握程度"></button>' +
              '<div class="pt-body"><p class="pt-text">' + esc(t) + '</p></div></div>';
          });
          if (items) groupsHTML += '<div class="pgroup ' + g.cls + '"><h4>' + g.icon + ' ' + g.label + '</h4><div class="plist">' + items + '</div></div>';
        });
        if (groupsHTML) mods += '<article class="module"><h3><span>' + esc(m.title) + '</span><em>' + esc(p.period) + ' · ' + esc(p.textbook) + '</em></h3>' + groupsHTML + '</article>';
      });
      if (mods) out += '<section class="period"><div class="period-head"><span class="pdot"></span><h2>' + esc(p.period) + '</h2><span class="pbook">' + esc(p.textbook) + '</span></div>' + mods + '</section>';
    });
    out += '<div class="hubstat" style="margin-top:10px"><div class="k" data-kb-hit>共 ' + shown + ' 条知识点</div></div>';
    return out;
  }

  function mount(id) {
    var sec = document.getElementById('kb');
    if (!sec) return;
    var btn = sec.querySelector('[data-kb-toggle]');
    var mini = sec.querySelector('[data-kb-mini]');
    var stat = sec.querySelector('[data-kb-stat]');
    var hint = sec.querySelector('[data-kb-hint]');
    master = LS.get('hub.master.' + id, {});

    function wire() {
      // 展开/收起知识点
      mini.querySelectorAll('.pt').forEach(function (row) {
        row.addEventListener('click', function (e) {
          if (e.target.classList.contains('dot')) return;
          var idp = row.dataset.pid;
          var open = row.classList.toggle('open');
          var d = cache[id];
          var e2 = (d.enrich || {})[idp] || {};
          var old = row.querySelector('.pt-detail');
          if (open) {
            if (!old) {
              var div = document.createElement('div');
              div.className = 'pt-detail';
              div.innerHTML = (e2.explain ? '<p><b>📖 讲解：</b>' + esc(e2.explain) + '</p>' : '') +
                (e2.example ? '<p><b>✏️ 例题：</b>' + esc(e2.example) + '</p>' : '') +
                (e2.tip ? '<p><b>⚠️ 易错：</b>' + esc(e2.tip) + '</p>' : '') +
                (!e2.explain && !e2.example && !e2.tip ? '<p>暂无讲解。</p>' : '');
              row.querySelector('.pt-body').appendChild(div);
            }
          } else if (old) old.remove();
        });
      });
      // 掌握度
      mini.querySelectorAll('.dot').forEach(function (dot) {
        dot.addEventListener('click', function (e) {
          e.stopPropagation();
          var idp = dot.dataset.id;
          var lv = master[idp] || 0;
          lv = lv >= 2 ? 0 : lv + 1;
          master[idp] = lv;
          LS.set('hub.master.' + id, master);
          dot.className = 'dot lv' + lv;
          var d = cache[id], pr = prog(d);
          var bar = mini.querySelector('.progwrap .progbar i');
          if (bar) bar.style.width = pr.pct + '%';
          var lab = mini.querySelector('.progwrap .proglabel');
          if (lab) lab.textContent = '已掌握 ' + pr.score + ' / ' + pr.total;
        });
      });
      // 导图
      mini.querySelectorAll('.mn-t.has').forEach(function (t) {
        t.addEventListener('click', function () {
          var li = t.parentElement;
          li.classList.toggle('open');
        });
      });
      mini.querySelectorAll('.mn-t').forEach(function (t) {
        t.addEventListener('click', function () {
          var tip = t.dataset.tip;
          if (!tip) return;
          var old = mini.querySelector('.maptip');
          if (old) old.remove();
          var dv = document.createElement('div');
          dv.className = 'maptip';
          dv.innerHTML = '<b>💡 ' + esc(t.textContent.replace(/[▸▾•💡\s]+/g, ' ').trim()) + '</b><p>' + esc(tip) + '</p>';
          var mb = mini.querySelector('[data-kb-map]');
          if (mb) mb.insertBefore(dv, mb.firstChild);
        });
      });
      // 检索
      var si = mini.querySelector('[data-kb-search]');
      if (si) {
        var timer = null;
        si.addEventListener('input', function () {
          clearTimeout(timer);
          timer = setTimeout(function () {
            query = si.value.trim().toLowerCase();
            var d = cache[id];
            var pos = mini.scrollTop;
            mini.innerHTML = renderMini(id, d);
            wire();
            var again = mini.querySelector('[data-kb-search]');
            if (again) { again.value = si.value; again.focus(); }
            mini.scrollTop = pos;
          }, 220);
        });
      }
      if (window.MOTION) window.MOTION.refresh();
    }

    btn.addEventListener('click', function () {
      if (opened) {
        mini.classList.remove('open');
        mini.style.maxHeight = '0px';
        btn.textContent = '展开本科知识库';
        opened = false;
        return;
      }
      btn.disabled = true;
      btn.textContent = '正在载入…';
      ensure(id).then(function (d) {
        mini.innerHTML = renderMini(id, d);
        mini.classList.add('open');
        mini.style.maxHeight = mini.scrollHeight + 'px';
        setTimeout(function () { if (opened) mini.style.maxHeight = 'none'; }, 820);
        opened = true;
        btn.disabled = false;
        btn.textContent = '收起本科知识库';
        var pr = prog(d);
        stat.textContent = pr.total + ' 个知识点 · 掌握 ' + pr.pct + '%';
        hint.textContent = '每条知识点都能点开看讲解、例题与易错提醒；圆点循环切换掌握程度。';
        wire();
      }).catch(function () {
        btn.disabled = false;
        btn.textContent = '展开本科知识库';
        hint.textContent = '载入失败：请用本地服务器打开（node tools/serve.cjs 8123）。';
      });
    });
  }

  window.KB = { html: html, mount: mount };
})();
