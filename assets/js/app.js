/* ==========================================================
   高二月考复习站 · 渲染与交互引擎
   数据源：window.SUBJECT_INDEX（首页）/ window.SUBJECT_DATA（学科页）
   ========================================================== */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ---------------- 主题 ---------------- */
  const THEME_KEY = 'study.theme';
  function paintTheme() {
    const t = LS.get(THEME_KEY, 'dark');
    document.documentElement.setAttribute('data-theme', t);
    const b = $('#themeBtn');
    if (b) b.textContent = t === 'dark' ? '🌙' : '☀️';
  }

  /* ---------------- 路径 ---------------- */
  const inSub = /\/subjects\//.test(location.pathname) || /subjects/.test(location.pathname);
  const HOME = inSub ? '../index.html' : 'index.html';
  const subHref = (id) => (inSub ? id + '.html' : 'subjects/' + id + '.html');
  const toolHref = (n) => (inSub ? '../' + n + '.html' : n + '.html');

  /* ---------------- 通用片段 ---------------- */
  function topbar(activeId, activeTool) {
    const list = (window.SUBJECT_INDEX || []).map(
      (s) => '<a href="' + subHref(s.id) + '" class="' + (s.id === activeId ? 'active' : '') + '">' + s.emoji + ' ' + esc(s.name) + '</a>'
    ).join('');
    return '<header class="topbar"><div class="wrap">' +
      '<a class="brand" href="' + HOME + '"><span class="dot"></span>高二上·第一次月考复习站</a>' +
      '<nav class="navtabs">' + list +
        '<a href="' + toolHref('hub') + '" class="' + (activeTool === 'hub' ? 'active' : '') + '">📚 知识库</a>' +
        '<a href="' + toolHref('sprint') + '" class="' + (activeTool === 'sprint' ? 'active' : '') + '">🚀 冲刺台</a>' +
      '</nav>' +
      '<button class="iconbtn" id="themeBtn" title="切换明暗主题">🌙</button>' +
      '</div></header>';
  }
  function backTop() {
    return '<button class="totop" id="toTop" title="回到顶部">↑</button>';
  }
  function stars(n) {
    const k = Math.max(1, Math.min(5, n || 3));
    return '<span class="freq" title="重要程度">' + '★'.repeat(k) + '☆'.repeat(5 - k) + '</span>';
  }

  /* ---------------- 进度存储 ---------------- */
  function storeKey(id) { return 'study.master.' + id; }
  function getMaster(id) { return LS.get(storeKey(id), {}); }

  /* ---------------- 板块渲染 ---------------- */
  function itemKey(sid, bid, i) { return sid + '|' + bid + '|' + i; }

  function renderBlock(b, sid) {
    const intro = b.intro ? '<p class="sec-sub">' + esc(b.intro) + '</p>' : '';
    let body = '';
    if (b.kind === 'table') {
      const cols = (b.cols || []).map((c) => '<th>' + esc(c) + '</th>').join('');
      const rows = (b.items || []).map((it) => {
        const cells = (it.cells || []).map((c) => '<td>' + c + '</td>').join('');
        return '<tr><td>' + esc(it.t) + '</td>' + cells + '</tr>';
      }).join('');
      body = '<div class="tblwrap"><table class="tbl"><thead><tr><th>项目</th>' + cols + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
    } else if (b.kind === 'vocab') {
      const rows = (b.items || []).map((it, i) => {
        const k = itemKey(sid, b.id, i);
        return '<tr data-search="' + esc(it.w + ' ' + it.pos + ' ' + it.cn + ' ' + (it.tip || '')) + '">' +
          '<td><span class="word">' + esc(it.w) + '</span></td>' +
          '<td>' + esc(it.pos || '') + '</td>' +
          '<td>' + esc(it.cn || '') + '</td>' +
          '<td>' + esc(it.tip || it.ex || '') + '</td>' +
          '<td><button class="master" data-mkey="' + k + '" title="标记已掌握">✓</button></td></tr>';
      }).join('');
      body = '<div class="tblwrap"><table class="tbl"><thead><tr><th>单词</th><th>词性</th><th>释义</th><th>搭配 / 拓展</th><th>掌握</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    } else if (b.kind === 'list') {
      body = '<div class="list">' + (b.items || []).map((it, i) => {
        const k = itemKey(sid, b.id, i);
        const t = typeof it === 'string' ? it : it.t;
        const d = typeof it === 'string' ? '' : it.d;
        return '<div class="li" data-search="' + esc(t + ' ' + d) + '"><div class="n">' + (i + 1) + '</div>' +
          '<div class="c"><b>' + esc(t) + '</b><span>' + esc(d) + '</span></div>' +
          '<button class="master" data-mkey="' + k + '" title="标记已掌握">✓</button></div>';
      }).join('') + '</div>';
    } else {
      body = '<div class="cards">' + (b.items || []).map((it, i) => {
        const k = itemKey(sid, b.id, i);
        return '<article class="kcard" data-search="' + esc(it.t + ' ' + it.d + ' ' + (it.tip || '')) + '">' +
          stars(it.freq) +
          '<h4>' + esc(it.t) + '</h4>' +
          '<p class="d">' + esc(it.d) + '</p>' +
          (it.tip ? '<p class="tip"><b>提醒：</b>' + esc(it.tip) + '</p>' : '') +
          '<button class="master" data-mkey="' + k + '" title="标记已掌握">✓</button></article>';
      }).join('') + '</div>';
    }
    return '<section class="block reveal" id="' + b.id + '">' +
      '<div class="sec-head"><span class="ic">' + esc(b.icon || '📌') + '</span><h2>' + esc(b.title) + '</h2></div>' +
      intro + body + '</section>';
  }

  /* ---------------- 闪卡 ---------------- */
  function flashSection(d) {
    const cards = d.flashcards || [];
    if (!cards.length) return '';
    const tags = [];
    cards.forEach((c) => { if (c.tag && tags.indexOf(c.tag) < 0) tags.push(c.tag); });
    const tagChips = '<div class="tagbar" id="fcTags"><button class="tagchip on" data-tag="*">全部</button>' +
      tags.map((t) => '<button class="tagchip" data-tag="' + esc(t) + '">' + esc(t) + '</button>').join('') + '</div>';
    return '<section class="block reveal" id="flash">' +
      '<div class="sec-head"><span class="ic">🎴</span><h2>记忆闪卡</h2></div>' +
      '<p class="sec-sub">点击卡片翻面看答案；键盘 ← → 翻页，空格翻面，K 标记「已掌握」。掌握状态保存在本机浏览器。</p>' +
      '<div class="fc-toolbar">' +
        '<button class="btn primary" id="fcFlip">🔄 翻面（空格）</button>' +
        '<button class="btn" id="fcPrev">← 上一张</button>' +
        '<button class="btn" id="fcNext">下一张 →</button>' +
        '<button class="btn" id="fcRandom">🎲 随机抽卡</button>' +
        '<button class="btn" id="fcShuffle">🔀 打乱牌序</button>' +
        '<button class="btn" id="fcOnlyNew">☐ 只看未掌握</button>' +
        '<button class="btn ghost" id="fcReset">↺ 重置掌握</button>' +
      '</div>' + tagChips +
      '<div class="progwrap"><div class="progbar"><i id="fcProg"></i></div><span class="proglabel" id="fcProgLabel">已掌握 0 / 0</span></div>' +
      '<div class="fcstage"><div class="fc-tilt" id="fcTilt">' +
        '<div class="flipcard" id="fcCard">' +
          '<div class="fc-face-glow"></div>' +
          '<div class="fcface front"><span class="side">QUESTION</span><span class="tagname" id="fcTagA"></span>' +
            '<div class="qtext" id="fcQ"></div><div class="hintline" id="fcHint"></div></div>' +
          '<div class="fcface back"><span class="side">ANSWER</span><span class="tagname" id="fcTagB"></span>' +
            '<div class="atext" id="fcA"></div></div>' +
        '</div></div></div>' +
      '<div class="fcmeta"><span class="fccounter" id="fcCount"></span>' +
        '<button class="btn on" id="fcKnown">✓ 我记住了</button></div>' +
      '<div style="height:18px"></div>' +
      '<div class="fcdeck" id="fcDeck"></div>' +
      '</section>';
  }

  function initFlash(d) {
    const all = d.flashcards || [];
    if (!all.length) return;
    const sid = d.id;
    const KKEY = 'study.flash.' + sid;
    let known = LS.get(KKEY, {});
    let order = all.map((_, i) => i);
    let cur = 0;
    let flipped = false;
    let tag = '*';
    let onlyNew = false;

    const el = {
      card: $('#fcCard'), tilt: $('#fcTilt'), q: $('#fcQ'), a: $('#fcA'), hint: $('#fcHint'),
      tagA: $('#fcTagA'), tagB: $('#fcTagB'), count: $('#fcCount'), deck: $('#fcDeck'),
      prog: $('#fcProg'), label: $('#fcProgLabel'), tags: $('#fcTags')
    };

    function pool() {
      return order.filter((i) => (tag === '*' || all[i].tag === tag) && (!onlyNew || !known[i]));
    }
    function refreshProgress() {
      const total = all.length;
      const n = Object.keys(known).filter((k) => known[k]).length;
      el.prog.style.width = (total ? (n / total) * 100 : 0) + '%';
      el.label.textContent = '已掌握 ' + n + ' / ' + total;
      if (total && n === total && !$('#fcDone')) {
        el.label.textContent += ' · 全部完成 🎉';
        confetti();
      }
    }
    function paint() {
      const p = pool();
      if (!p.length) {
        el.q.textContent = '这个筛选下没有卡片了 🎉';
        el.a.textContent = '换个分类，或点「重置掌握」重新开始。';
        el.count.textContent = '0 / 0';
        return;
      }
      if (cur >= p.length) cur = 0;
      const idx = p[cur];
      const c = all[idx];
      el.q.textContent = c.q;
      el.a.textContent = c.a;
      el.hint.textContent = c.tip ? '💡 ' + c.tip : '';
      el.tagA.textContent = c.tag || '';
      el.tagB.textContent = c.tag || '';
      el.count.textContent = '第 ' + (cur + 1) + ' / ' + p.length + ' 张　·　当前第 ' + (idx + 1) + ' 号卡　·　按 K 掌握';
      $('#fcKnown').className = 'btn ' + (known[idx] ? 'on' : '');
      $('#fcKnown').textContent = known[idx] ? '✓ 已掌握（再点取消）' : '✓ 我记住了';
      $$('#fcDeck .deckitem').forEach((b, i) => {
        b.className = 'deckitem' + (i === idx ? ' cur' : '') + (known[i] ? ' known' : '');
      });
    }
    function paintDeck() {
      el.deck.innerHTML = all.map((c, i) =>
        '<div class="deckitem' + (known[i] ? ' known' : '') + '" data-i="' + i + '">' +
        '<b>#' + (i + 1) + ' · ' + esc(c.tag || '') + '</b>' + esc(String(c.q).slice(0, 22)) + '</div>'
      ).join('');
    }
    function go(delta) { const p = pool(); if (!p.length) return; cur = (cur + delta + p.length) % p.length; setFlip(false); paint(); }
    function setFlip(v) { flipped = v; el.card.classList.toggle('flipped', v); }
    function jumpTo(i) {
      const p = pool();
      if (!p.length) return;
      const at = p.indexOf(i);
      if (at >= 0) { cur = at; setFlip(false); paint(); }
    }

    el.card.addEventListener('click', () => setFlip(!flipped));
    $('#fcFlip').addEventListener('click', () => setFlip(!flipped));
    $('#fcNext').addEventListener('click', () => go(1));
    $('#fcPrev').addEventListener('click', () => go(-1));
    $('#fcRandom').addEventListener('click', () => { const p = pool(); if (!p.length) return; cur = Math.floor(Math.random() * p.length); setFlip(false); paint(); });
    $('#fcShuffle').addEventListener('click', () => {
      for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = order[i]; order[i] = order[j]; order[j] = t; }
      cur = 0; setFlip(false); paintDeck(); paint(); flash('牌序已打乱');
    });
    $('#fcOnlyNew').addEventListener('click', (e) => {
      onlyNew = !onlyNew; cur = 0;
      e.currentTarget.classList.toggle('on', onlyNew);
      e.currentTarget.textContent = (onlyNew ? '☑' : '☐') + ' 只看未掌握';
      paint();
    });
    $('#fcReset').addEventListener('click', () => { known = {}; LS.set(KKEY, known); paintDeck(); refreshProgress(); paint(); flash('掌握进度已重置'); });
    $('#fcKnown').addEventListener('click', () => { const p = pool(); if (!p.length) return; known[p[cur]] = !known[p[cur]]; LS.set(KKEY, known); paintDeck(); refreshProgress(); paint(); if (known[p[cur]]) go(1); });
    el.deck.addEventListener('click', (e) => { const t = e.target.closest('.deckitem'); if (t) jumpTo(+t.dataset.i); });
    el.tags.addEventListener('click', (e) => {
      const t = e.target.closest('.tagchip'); if (!t) return;
      tag = t.dataset.tag; cur = 0;
      $$('.tagchip', el.tags).forEach((x) => x.classList.toggle('on', x === t));
      paint();
    });

    document.addEventListener('keydown', (e) => {
      if (/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) return;
      if (e.key === 'ArrowRight') { go(1); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { go(-1); e.preventDefault(); }
      else if (e.key === ' ') { setFlip(!flipped); e.preventDefault(); }
      else if (e.key === 'k' || e.key === 'K') { $('#fcKnown').click(); }
    });

    // 3D 倾斜
    const stage = el.card.parentElement.parentElement;
    stage.addEventListener('mousemove', (e) => {
      const r = stage.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5;
      const py = (e.clientY - r.top) / r.height - .5;
      el.tilt.style.transform = 'rotateY(' + (px * 7) + 'deg) rotateX(' + (-py * 7) + 'deg)';
    });
    stage.addEventListener('mouseleave', () => { el.tilt.style.transform = ''; });

    paintDeck(); refreshProgress(); paint();
  }

  function flash(msg) {
    const n = document.createElement('div');
    n.textContent = msg;
    n.style.cssText = 'position:fixed;left:50%;bottom:34px;transform:translateX(-50%);padding:10px 20px;border-radius:12px;' +
      'background:var(--panel);border:1px solid var(--line);backdrop-filter:blur(12px);color:var(--txt);font-size:13.5px;z-index:200;box-shadow:var(--shadow)';
    document.body.appendChild(n);
    setTimeout(() => { n.style.transition = 'opacity .4s'; n.style.opacity = '0'; }, 1100);
    setTimeout(() => n.remove(), 1600);
  }

  function confetti() {
    const box = document.createElement('div');
    box.className = 'confetti';
    const colors = ['#5b8cff', '#25d8ee', '#34d399', '#fbbf24', '#f472b6', '#a855f7'];
    for (let i = 0; i < 90; i++) {
      const p = document.createElement('i');
      p.style.left = Math.random() * 100 + 'vw';
      p.style.top = '-4vh';
      p.style.background = colors[i % colors.length];
      p.style.animationDuration = (1.6 + Math.random() * 1.8) + 's';
      p.style.animationDelay = (Math.random() * .5) + 's';
      p.style.transform = 'rotate(' + (Math.random() * 360) + 'deg)';
      box.appendChild(p);
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 4200);
  }

  /* ---------------- 自测 ---------------- */
  function quizSection(d) {
    const qs = d.quiz || [];
    if (!qs.length) return '';
    return '<section class="block reveal" id="quiz">' +
      '<div class="sec-head"><span class="ic">✍️</span><h2>即时自测</h2></div>' +
      '<p class="sec-sub">点选项立刻判分并给解析，做完全部会显示得分。建议先做一遍，错题回看对应考点。</p>' +
      '<div class="quiz" id="quizBox">' + qs.map((q, i) =>
        '<div class="q" data-qi="' + i + '"><div class="qt"><em>Q' + (i + 1) + '</em>' + esc(q.q) + '</div>' +
        '<div class="opts">' + (q.options || []).map((o, j) =>
          '<button class="opt" data-j="' + j + '">' + String.fromCharCode(65 + j) + '. ' + esc(o) + '</button>').join('') +
        '</div><div class="explain"><b>解析：</b>' + esc(q.explain || '') + '</div></div>').join('') +
      '</div><div class="fcmeta" style="margin-top:18px"><span class="fccounter" id="quizScore">已作答 0 / ' + qs.length + '　得分 0</span>' +
      '<button class="btn" id="quizReset">↺ 重做</button></div></section>';
  }

  function initQuiz(d) {
    const qs = d.quiz || [];
    const box = $('#quizBox');
    if (!box) return;
    let done = {}, right = 0;

    function paintScore() {
      $('#quizScore').textContent = '已作答 ' + Object.keys(done).length + ' / ' + qs.length + '　得分 ' + right;
    }
    box.addEventListener('click', (e) => {
      const btn = e.target.closest('.opt');
      if (!btn) return;
      const q = btn.closest('.q');
      const qi = +q.dataset.qi;
      if (done[qi]) return;
      const j = +btn.dataset.j;
      const ans = qs[qi].answer;
      done[qi] = true;
      $$('.opt', q).forEach((b, k) => {
        b.disabled = true;
        if (k === ans) b.classList.add('right');
        else if (k === j) b.classList.add('wrong');
      });
      $('.explain', q).classList.add('show');
      if (j === ans) { right++; }
      paintScore();
      if (Object.keys(done).length === qs.length) {
        setTimeout(() => { flash('自测完成！得分 ' + right + ' / ' + qs.length); if (right / qs.length >= .8) confetti(); }, 260);
      }
    });
    $('#quizReset').addEventListener('click', () => {
      done = {}; right = 0;
      $$('.q', box).forEach((q) => {
        $$('.opt', q).forEach((b) => { b.disabled = false; b.classList.remove('right', 'wrong'); });
        $('.explain', q).classList.remove('show');
      });
      paintScore();
    });
    paintScore();
  }

  /* ---------------- 搜索 ---------------- */
  function initSearch(d) {
    const input = $('#searchInput');
    if (!input) return;
    function clearMarks(root) {
      $$('mark', root).forEach((m) => { const p = m.parentNode; p.replaceChild(document.createTextNode(m.textContent), m); p.normalize(); });
    }
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      const nodes = $$('[data-search], .kcard, .li, table.tbl tbody tr');
      nodes.forEach((n) => {
        clearMarks(n);
        if (!q) { n.classList.remove('hidden-by-search'); return; }
        const hit = (n.getAttribute('data-search') || n.textContent).toLowerCase().indexOf(q) >= 0;
        n.classList.toggle('hidden-by-search', !hit);
      });
    });
  }

  /* ---------------- 掌握度总进度 ---------------- */
  function initMaster(d) {
    const key = storeKey(d.id);
    const map = getMaster(d.id);
    const buttons = $$('.master[data-mkey]');
    const bar = $('#allProg');
    const lab = $('#allProgLabel');
    function refresh() {
      const total = buttons.length;
      const n = buttons.filter((b) => map[b.dataset.mkey]).length;
      if (bar) bar.style.width = (total ? (n / total) * 100 : 0) + '%';
      if (lab) lab.textContent = '考点掌握 ' + n + ' / ' + total;
    }
    buttons.forEach((b) => {
      if (map[b.dataset.mkey]) b.classList.add('on');
      b.addEventListener('click', () => {
        const k = b.dataset.mkey;
        map[k] = !map[k];
        b.classList.toggle('on', !!map[k]);
        LS.set(key, map);
        refresh();
      });
    });
    refresh();
  }

  /* ---------------- 首页 ---------------- */
  function renderHome() {
    const idx = window.SUBJECT_INDEX || [];
    const app = $('#app');
    app.innerHTML = topbar('') +
      '<main class="wrap">' +
        '<div class="hero">' +
          '<h1>高二上 · 第一次月考<br><span class="grad">六科考点 · 分科复习站</span></h1>' +
          '<p class="lead">每科一个独立页面，内置考点清单、二级结论、作文素材、单词表、语法、物理结论、化学方法与生物读图法；' +
          '配 3D 闪卡、即时自测和掌握度追踪，状态自动保存在本机。</p>' +
          '<div class="pills">' +
            '<span class="pill">🎴 <b>' + idx.reduce((a, s) => a + (s.cards || 0), 0) + '</b> 张闪卡</span>' +
            '<span class="pill">📐 <b>' + idx.length + '</b> 个学科页面</span>' +
            '<span class="pill">✍️ 每科配套自测</span>' +
            '<span class="pill">🌗 明暗主题</span>' +
          '</div>' +
        '</div>' +
        '<div class="subgrid">' + idx.map((s) =>
          '<a class="subcard reveal" style="--c:' + s.accent + '" href="' + subHref(s.id) + '">' +
            '<span class="emoji">' + s.emoji + '</span>' +
            '<h3>' + esc(s.name) + '</h3>' +
            '<p class="rng">' + esc(s.range) + '</p>' +
            '<span class="go">进入复习 <i>→</i></span>' +
          '</a>').join('') +
        '</div>' +
        '<section class="block reveal" id="tools">' +
          '<div class="sec-head"><span class="ic">🧰</span><h2>合并进来的两大工具</h2></div>' +
          '<p class="sec-sub">已把 GitHub 上另外两个项目的内容并入本站：知识点库与冲刺工具台，源仓库保持原样、未做任何改动。</p>' +
          '<div class="subgrid" style="padding:8px 0 10px">' +
            '<a class="subcard reveal" style="--c:#22d3ee" href="' + toolHref('hub') + '"><span class="emoji">📚</span><h3>全科知识库</h3>' +
              '<p class="rng">来自 high-school-knowledge-hub：六科 2408 个知识点，按学段 → 模块 → 重点/难点/考点组织，含详细讲解、例题解析与易错提醒，支持三级掌握度、检索与随机复习。</p>' +
              '<span class="go">进入知识库 <i>→</i></span></a>' +
            '<a class="subcard reveal" style="--c:#fbbf24" href="' + toolHref('sprint') + '"><span class="emoji">🚀</span><h3>月考冲刺台</h3>' +
              '<p class="rng">来自 gao2-monthly-exam-review：月考倒计时、按剩余天数自动排布的复习计划、各科时间占比、打卡清单、考场策略、108 道训练题与六科知识导图。</p>' +
              '<span class="go">进入冲刺台 <i>→</i></span></a>' +
          '</div>' +
        '</section>' +
        '<section class="block reveal">' +
          '<div class="sec-head"><span class="ic">🧭</span><h2>怎么用这个站</h2></div>' +
          '<div class="list">' +
            ['先过一遍「考点清单」，用卡片右下角的 ✓ 标记已经掌握的（右上角 ★ 是重要程度）。',
             '再用「闪卡」做主动回忆：先自己想，再翻面核对；没记住的点「只看未掌握」反复刷。',
             '考前 3 天做「即时自测」，错题回到对应板块重看。',
             '零碎时间背单词表和二级结论，考前一晚只看 ★★★★ 以上的内容。'
            ].map((t, i) => '<div class="li"><div class="n">' + (i + 1) + '</div><div class="c"><b>' + esc(t) + '</b></div></div>').join('') +
          '</div>' +
        '</section>' +
      '</main>' + backTop();
    afterRender();
  }

  /* ---------------- 学科页 ---------------- */
  function renderSubject() {
    const d = window.SUBJECT_DATA;
    const app = $('#app');
    d.accent = d.accent || '#5b8cff';
    // 并入「冲刺站」迁移板块与闪卡
    const extra = window.SUBJECT_EXTRA;
    if (extra) {
      const baseBlocks = d.blocks || [];
      (extra.blocks || []).forEach((b) => baseBlocks.push(b));
      d.blocks = baseBlocks;
      d.flashcards = (d.flashcards || []).concat(extra.flashcards || []);
      d.mergedFromSprint = true;
    }
    document.documentElement.style.setProperty('--accent', d.accent);
    const blocks = d.blocks || [];
    const chips = blocks.map((b) => '<a href="#' + b.id + '">' + esc(b.icon || '') + ' ' + esc(b.title) + '</a>').join('') +
      (d.flashcards && d.flashcards.length ? '<a href="#flash">🎴 记忆闪卡</a>' : '') +
      (d.quiz && d.quiz.length ? '<a href="#quiz">✍️ 即时自测</a>' : '');

    const strat = d.strategy || {};
    const stratHTML = '<section class="block reveal" id="strategy">' +
      '<div class="sec-head"><span class="ic">🎯</span><h2>复习策略</h2></div>' +
      (strat.idea ? '<p class="sec-sub">' + esc(strat.idea) + '</p>' : '') +
      '<div class="steps">' + (strat.steps || []).map((s) =>
        '<div class="step"><b>' + esc(s.t) + '</b><span>' + esc(s.d) + '</span></div>').join('') + '</div>' +
      (strat.pitfalls && strat.pitfalls.length ?
        '<div class="warnbox"><h4>⚠️ 最容易丢分的地方</h4><ul>' +
        strat.pitfalls.map((p) => '<li>' + esc(p) + '</li>').join('') + '</ul></div>' : '') +
      '</section>';

    app.innerHTML = topbar(d.id) +
      '<main class="wrap">' +
        '<div class="hero">' +
          '<h1><span style="font-size:.9em">' + (d.emoji || '') + '</span> ' + esc(d.name) + ' · <span class="grad">第一次月考</span></h1>' +
          '<p class="lead">' + esc(d.range || '') + '</p>' +
          (d.slogan ? '<p class="lead" style="color:var(--txt)">' + esc(d.slogan) + '</p>' : '') +
          (d.mergedFromSprint ? '<div class="pills"><span class="pill" style="border-color:var(--ok)">🔗 已并入「月考冲刺站」的速查表与闪卡</span></div>' : '') +
          '<div class="pills"><span class="pill">📚 <b>' + blocks.length + '</b> 个考点板块</span>' +
          '<span class="pill">🎴 <b>' + ((d.flashcards || []).length) + '</b> 张闪卡</span>' +
          '<span class="pill">✍️ <b>' + ((d.quiz || []).length) + '</b> 道自测</span>' +
          '</div>' +
          (d.stats && d.stats.length ? '<div class="stats">' + d.stats.map((s) =>
            '<div class="stat"><div class="k">' + esc(s.k) + '</div><div class="v">' + esc(s.v) + '</div></div>').join('') + '</div>' : '') +
        '</div>' +
        '<div class="chips">' + chips + '<a href="#strategy">🎯 复习策略</a></div>' +
        '<div class="searchbar"><input id="searchInput" placeholder="🔍 在本页检索考点、结论、单词、卡片关键词…"></div>' +
        '<div class="progwrap"><div class="progbar"><i id="allProg"></i></div><span class="proglabel" id="allProgLabel">考点掌握 0 / 0</span></div>' +
        stratHTML +
        blocks.map((b) => renderBlock(b, d.id)).join('') +
        flashSection(d) +
        quizSection(d) +
      '</main>' + backTop();
    afterRender();
    initMaster(d);
    initFlash(d);
    initQuiz(d);
    initSearch(d);
  }

  /* ---------------- 渲染后通用 ---------------- */
  function afterRender() {
    paintTheme();
    const tb = $('#themeBtn');
    if (tb) tb.addEventListener('click', () => {
      const next = LS.get(THEME_KEY, 'dark') === 'dark' ? 'light' : 'dark';
      LS.set(THEME_KEY, next); paintTheme();
    });
    const tt = $('#toTop');
    if (tt) {
      tt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
      window.addEventListener('scroll', () => tt.classList.toggle('show', window.scrollY > 520), { passive: true });
    }
    // 滚动入场 + 目录高亮（不支持 IntersectionObserver 时直接显示全部内容）
    if (typeof window.IntersectionObserver === 'function') {
      const io = new window.IntersectionObserver((es) => {
        es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -8% 0px', threshold: .06 });
      $$('.reveal').forEach((n) => io.observe(n));
      const secs = $$('section.block');
      if (secs.length) {
        const chips = $$('.chips a');
        const spy = new window.IntersectionObserver((es) => {
          es.forEach((e) => {
            if (e.isIntersecting) {
              chips.forEach((c) => c.classList.toggle('active', c.getAttribute('href') === '#' + e.target.id));
            }
          });
        }, { rootMargin: '-25% 0px -65% 0px' });
        secs.forEach((s) => spy.observe(s));
      }
    } else {
      $$('.reveal').forEach((n) => n.classList.add('in'));
    }
  }

  initThemeAndRender();
  function initThemeAndRender() {
    paintTheme();
    if (window.STUDY_NO_AUTO) return;
    if (window.SUBJECT_DATA) renderSubject();
    else if (window.SUBJECT_INDEX) renderHome();
  }
  window.STUDY = { confetti, flash, renderSubject, renderHome, topbar, afterRender, esc, LS, stars, toolHref, subHref };
})();
