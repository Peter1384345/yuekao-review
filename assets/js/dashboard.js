/* ==========================================================
   备考驾驶舱 · 由 gao2-monthly-exam-review 的工具体系重构融合
   倒计时环 / 环形时间占比 / 复习计划 / 打卡 / 训练场
   ========================================================== */
(function () {
  'use strict';
  var S = window.STUDY;
  var esc = S.esc, LS = S.LS;

  var SUBS = [
    { id: 'math',      name: '数学', emoji: '📐', pct: 25, accent: '#5b8cff' },
    { id: 'physics',   name: '物理', emoji: '⚡', pct: 22, accent: '#a78bfa' },
    { id: 'chemistry', name: '化学', emoji: '🧪', pct: 18, accent: '#fbbf24' },
    { id: 'english',   name: '英语', emoji: '🔤', pct: 12, accent: '#34d399' },
    { id: 'chinese',   name: '语文', emoji: '📖', pct: 12, accent: '#ef6f6c' },
    { id: 'biology',   name: '生物', emoji: '🧬', pct: 11, accent: '#22d3ee' }
  ];
  var DATE_KEY = 'sprint.examDate', CHECK_KEY = 'sprint.checklist', BEST_KEY = 'sprint.best';
  var TASKS = {
    chinese: ['8 篇必背默写逐篇过一遍，错字单独抄', '《论语》《老子》四章逐句翻译', '信息类文本六种设错类型背熟', '作文素材 6 人物 + 6 金句成段', '限时写一篇 800 字议论文'],
    math: ['空间向量运算 10 道纯计算', '建系三类模型默写坐标', '法向量 20 道限时训练', '线面角 / 二面角 / 点面距公式默写', '立体几何大题限时 12 分钟'],
    english: ['选必一 67 个核心词块过一遍', '五大语法结构判定专项', '语法填空 20 道', '阅读 4 篇 + 七选五限时', '背 10 组读后续写高级表达'],
    physics: ['六种典型电场线分布默画', '类平抛两个公式推导一次', '电容器动态分析两种情形推导', '电表改装公式默写', '螺旋测微器 / 游标卡尺读数练习'],
    chemistry: ['热化学方程式书写五要点自查', '盖斯定律 10 道', '三段式解平衡 5 道', '勒夏特列原理四条移动方向', '平衡图像定一议二训练'],
    biology: ['内环境四液关系图默画', '静息 / 动作电位离子机制', '反射弧与突触单向传递原因', '激素分级调节 + 负反馈图默画', '读图六步法练 10 道图表题']
  };
  var STRATEGY = [
    { t: '答题顺序', d: '先易后难；小题每题限时 2–3 分钟，卡住先标记跳过，做完基础再回头攻坚。' },
    { t: '审题三遍', d: '圈关键词——「恒成立」「恰好」「不计重力」「保留两位小数」；先明确问什么再下笔。' },
    { t: '步骤分意识', d: '物理 / 化学 / 数学大题按「公式 → 代入数据 → 结果」完整书写，列式即有分，别跳步。' },
    { t: '时间分配', d: '按分值分配时间，单题难题不超过 15 分钟，给最后检查至少留 10 分钟。' },
    { t: '检查重点', d: '先查计算（数学、化学三段式、物理代数），再查易错点：单位、正负号、有效数字、涂卡位置。' },
    { t: '心态锚点', d: '开考前 3 分钟深呼吸，把「会做的全做对」写在草稿纸角落；遇难题先跳，不让单题影响全局。' }
  ];

  var examDate = LS.get(DATE_KEY, '2026-10-09');
  var checklist = LS.get(CHECK_KEY, {});
  var best = LS.get(BEST_KEY, {});
  var scope = 'all', sub = 'math';
  var set = null, idx = 0, right = 0;

  function daysLeft() {
    var t = new Date(examDate + 'T00:00:00');
    var n = new Date();
    return Math.round((t - new Date(n.getFullYear(), n.getMonth(), n.getDate())) / 86400000);
  }
  function stages(n) {
    if (n < 0) return [{ t: '考试已过', d: '把这次月考的错题整理成册，比什么复习都值钱。' }];
    if (n <= 2) return [
      { t: '第 1 天 · 只背不练', d: '把六科的二级结论、默写、单词表、公式表过一遍，不再做新题。' },
      { t: '考前当晚 · 只看错题', d: '翻错题本与闪卡，22:30 前睡觉，保证第二天状态。' }
    ];
    if (n <= 6) return [
      { t: '前一半 · 专题补漏', d: '六科各挑 1—2 个最弱的板块，只看考点 + 闪卡 + 自测错题，不求面面俱到。' },
      { t: '后一半 · 限时套卷', d: '每科做一套限时卷，重点练时间分配与答题规范；做完只订正，不刷新题。' }
    ];
    var a = Math.max(2, Math.round(n * .3)), b = Math.max(2, Math.round(n * .3));
    return [
      { t: 'D1—D' + a + ' · 基础回归', d: '六科考点清单过一遍，用闪卡做主动回忆，把不会的标出来。语文默写、英语词块、化学热化学方程式的规范书写优先。' },
      { t: 'D' + (a + 1) + '—D' + (a + b) + ' · 专题突破', d: '按分值从高到低攻：数学空间向量 → 物理电场电路 → 化学平衡 → 其余。每科集中攻 2 个高频题型，做透比做多重要。' },
      { t: 'D' + (a + b + 1) + '—D' + Math.max(a + b + 1, n - 2) + ' · 套卷实战', d: '每科一套限时卷，严格按考试时间。重点不是分数，而是暴露「会做但丢分」的地方。' },
      { t: '考前 2 天 · 回炉', d: '只看错题本、二级结论、默写与单词表；不再做新题，把作息调到考试节奏。' }
    ];
  }

  /* ---------------- 驾驶舱 ---------------- */
  function html() {
    var n = daysLeft(), st = stages(n);
    return '<section class="block reveal" id="dash">' +
      '<div class="sec-head"><span class="ic">🛰️</span><h2>备考驾驶舱</h2></div>' +
      '<p class="sec-sub">倒计时、复习计划、时间分配与打卡都在这一个面板里；数据保存在本机浏览器。</p>' +
      '<div class="dashgrid">' +
        '<div class="dashcard">' +
          '<div class="ringbox">' +
            '<div class="ringwrap">' +
              '<svg class="ring" viewBox="0 0 150 150">' +
                '<defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">' +
                '<stop offset="0%" stop-color="var(--accent)"/><stop offset="100%" stop-color="var(--accent2)"/></linearGradient></defs>' +
                '<circle class="bgc" cx="75" cy="75" r="64"/>' +
                '<circle class="fgc" id="ringFg" cx="75" cy="75" r="64" stroke-dasharray="402" stroke-dashoffset="402"/>' +
              '</svg>' +
              '<div class="ringtext"><b id="cdNum">–</b><span>天后开考</span></div>' +
            '</div>' +
            '<div class="cdinfo">' +
              '<p id="cdLine">正在计算…</p>' +
              '<label>考试日期：<input type="date" id="examDate" value="' + esc(examDate) + '"></label>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="dashcard">' +
          '<h3 style="margin:0 0 12px;font-size:16px">📊 各科每日时间占比</h3>' +
          '<div class="donut">' +
            '<svg viewBox="0 0 168 168" id="donutSvg"><circle cx="84" cy="84" r="70" fill="none" stroke="var(--panel2)" stroke-width="20"/>' +
            SUBS.map(function (s) { return '<circle class="seg" data-id="' + s.id + '" cx="84" cy="84" r="70" stroke="' + s.accent + '"/>'; }).join('') +
            '</svg>' +
            '<div class="dlegend">' + SUBS.map(function (s) {
              return '<div><i style="background:' + s.accent + '"></i>' + s.emoji + ' ' + s.name + '<b>' + s.pct + '%</b></div>';
            }).join('') + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="dashcard" style="margin-top:18px">' +
        '<h3 style="margin:0 0 14px;font-size:16px">🗓️ 复习计划 · 按剩余天数自动排布</h3>' +
        '<div class="steps">' + st.map(function (s) { return '<div class="step"><b>' + esc(s.t) + '</b><span>' + esc(s.d) + '</span></div>'; }).join('') + '</div>' +
      '</div>' +
    '</section>' +
    '<section class="block reveal" id="check">' +
      '<div class="sec-head"><span class="ic">✅</span><h2>打卡清单</h2></div>' +
      '<p class="sec-sub">共 30 项，已打卡 <b id="ckNum">0</b> 项。勾选状态保存在本机。</p>' +
      '<div class="checkgrid">' + SUBS.map(function (s) {
        return '<div class="ckcard" style="--c:' + s.accent + '"><h4>' + s.emoji + ' ' + s.name + '</h4>' +
          TASKS[s.id].map(function (t, i) {
            var k = s.id + i;
            return '<label class="ckitem' + (checklist[k] ? ' on' : '') + '"><input type="checkbox" data-ck="' + k + '"' + (checklist[k] ? ' checked' : '') + '><span>' + esc(t) + '</span></label>';
          }).join('') + '</div>';
      }).join('') + '</div>' +
    '</section>' +
    '<section class="block reveal" id="exam">' +
      '<div class="sec-head"><span class="ic">🎯</span><h2>考场临场策略</h2></div>' +
      '<p class="sec-sub">会做的全做对，就是超常发挥。</p>' +
      '<div class="cards">' + STRATEGY.map(function (s) {
        return '<article class="kcard"><h4>' + esc(s.t) + '</h4><p class="d">' + esc(s.d) + '</p></article>';
      }).join('') + '</div>' +
    '</section>' +
    trainerHTML('all');
  }

  /* ---------------- 训练场（首页全科 / 分科页单科复用） ---------------- */
  function pool(id) {
    var out = [];
    ((window.SPRINT_TRAIN || {})[id] || []).forEach(function (q) {
      out.push({ kind: q.type, q: q.q, options: q.options, a: q.answer, ex: q.explain, src: '冲刺站' });
    });
    var aq = (window.ALL_QUIZ || {})[id];
    if (aq) aq.quiz.forEach(function (q) { out.push({ kind: 'single', q: q.q, options: q.options, a: q.answer, ex: q.explain, src: '本站自测' }); });
    var sq = window.SUBJECT_QUIZ;
    if (sq && sq.id === id) sq.quiz.forEach(function (q) { out.push({ kind: 'single', q: q.q, options: q.options, a: q.answer, ex: q.explain, src: '本站自测' }); });
    return out;
  }
  function trainerHTML(sc) {
    var tabs = sc === 'all'
      ? '<div class="sptabs" data-train-tabs>' + SUBS.map(function (s) {
          return '<button class="sptab' + (s.id === sub ? ' on' : '') + '" data-tsub="' + s.id + '" style="--c:' + s.accent + '">' + s.emoji + ' ' + s.name + '</button>';
        }).join('') + '</div>'
      : '';
    var total = (sc === 'all' ? SUBS : SUBS.filter(function (s) { return s.id === sc; }))
      .reduce(function (a, s) { return a + pool(s.id).length; }, 0);
    return '<section class="block reveal" id="train"' + (sc === 'all' ? '' : ' data-scope="' + sc + '"') + '>' +
      '<div class="sec-head"><span class="ic">🏋️</span><h2>' + (sc === 'all' ? '全科训练场' : '本科训练场') + '</h2></div>' +
      '<p class="sec-sub">题库 = 冲刺站题库 + 本站自测，' + (sc === 'all' ? '共 ' + SUBS.reduce(function (a, s) { return a + pool(s.id).length; }, 0) + ' 题，六科可切换' : '本科共 ' + total + ' 题') +
      '。每轮随机抽 5 题，判断 + 单选混合，做完立即判分并给解析。</p>' +
      tabs +
      '<div class="fcmeta" style="margin:14px 0"><span class="fccounter" data-train-best></span>' +
      '<button class="btn primary" data-train-start>🎲 抽 5 题开始</button></div>' +
      '<div data-train-box></div>' +
    '</section>';
  }
  function mountTrainer(rootEl, sc) {
    var root = rootEl ? rootEl.querySelector('[data-train-box]') : document.querySelector('[data-train-box]');
    if (!root) return;
    var wrap = root.closest('section') || document;
    var local = sc || 'all';
    var tabsEl = wrap.querySelector('[data-train-tabs]');
    var currentQ = null, locked = false;
    // 事件委托：绑定一次，永不受重新渲染影响
    root.addEventListener('click', function (e) {
      var b = e.target.closest('.opt');
      if (!b || locked || !currentQ || b.disabled) return;
      locked = true;
      var q = currentQ;
      var chosen = q.kind === 'judge' ? b.dataset.j === '1' : +b.dataset.j;
      root.querySelectorAll('.opt').forEach(function (x) {
        x.disabled = true;
        var v = q.kind === 'judge' ? x.dataset.j === '1' : +x.dataset.j;
        if (v === q.a) x.classList.add('right');
        else if (v === chosen) x.classList.add('wrong');
      });
      var ex = root.querySelector('.explain');
      if (ex) ex.classList.add('show');
      if (chosen === q.a) right++;
      setTimeout(function () { currentQ = null; idx++; paint(); }, 1150);
    });
    function currentSub() { return local === 'all' ? sub : local; }
    function paintBest() {
      var el = wrap.querySelector('[data-train-best]');
      if (!el) return;
      var id = currentSub();
      var rec = best[id];
      var p = pool(id);
      el.textContent = (rec != null ? '本科最高分 ' + rec + ' / 5　·　' : '') + '题库 ' + p.length + ' 题';
    }
    function start() {
      var p = pool(currentSub());
      for (var i = p.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = p[i]; p[i] = p[j]; p[j] = t; }
      set = p.slice(0, Math.min(5, p.length)); idx = 0; right = 0;
      paint();
    }
    function paint() {
      paintBest();
      if (!set) { root.innerHTML = '<div class="hubload">点「抽 5 题开始」进入训练。</div>'; return; }
      if (idx >= set.length) {
        var id = currentSub();
        if (best[id] == null || right > best[id]) { best[id] = right; LS.set(BEST_KEY, best); }
        root.innerHTML = '<div class="trainend"><h3>🎉 本轮得分 ' + right + ' / ' + set.length + '</h3><p>本科最高分：' + best[id] + ' / 5</p>' +
          '<button class="btn primary" data-train-start>再来一轮</button></div>';
        root.querySelector('[data-train-start]').addEventListener('click', start);
        S.confetti();
        paintBest();
        return;
      }
      var q = set[idx];
      currentQ = q; locked = false;
      var opts = q.kind === 'judge'
        ? '<button class="opt" data-j="1">对</button><button class="opt" data-j="0">错</button>'
        : (q.options || []).map(function (o, i) { return '<button class="opt" data-j="' + i + '">' + 'ABCD'.charAt(i) + '. ' + esc(o) + '</button>'; }).join('');
      root.innerHTML = '<div class="q"><div class="qt"><em>Q' + (idx + 1) + '/' + set.length + '</em>' + esc(q.q) +
        '<span class="src">' + esc(q.src) + (q.kind === 'judge' ? ' · 判断题' : ' · 单选') + '</span></div>' +
        '<div class="opts">' + opts + '</div>' +
        '<div class="explain"><b>解析：</b>' + esc(q.ex) + '</div></div>';
    }
    var startBtn = wrap.querySelector('[data-train-start]');
    if (startBtn) startBtn.addEventListener('click', start);
    if (tabsEl) tabsEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-tsub]');
      if (!b) return;
      sub = b.dataset.tsub;
      tabsEl.querySelectorAll('.sptab').forEach(function (x) { x.classList.toggle('on', x === b); });
      set = null; paint();
    });
    paint();
  }

  /* ---------------- 绑定 ---------------- */
  function mount() {
    var n = daysLeft();
    var num = document.getElementById('cdNum');
    var ring = document.getElementById('ringFg');
    var line = document.getElementById('cdLine');
    function drawCd() {
      var d = daysLeft();
      var C = 2 * Math.PI * 64;
      var pct = Math.max(0, Math.min(1, d / 30));
      if (num) num.textContent = d >= 0 ? d : 0;
      if (ring) { ring.setAttribute('stroke-dasharray', C.toFixed(1)); ring.setAttribute('stroke-dashoffset', (C * (1 - pct)).toFixed(1)); }
      if (line) line.innerHTML = d > 0 ? '距离考试还有 <b>' + d + '</b> 天，按计划走就不慌。'
        : d === 0 ? '今天就是考试日，稳住节奏。'
        : '考试日期已过 ' + (-d) + ' 天，别忘了把错题整理成册。';
    }
    drawCd();
    var di = document.getElementById('examDate');
    if (di) di.addEventListener('change', function () {
      examDate = di.value || examDate;
      LS.set(DATE_KEY, examDate);
      drawCd();
      // 计划同步刷新
      var box = document.querySelector('#dash .dashcard:last-child .steps');
      if (box) box.innerHTML = stages(daysLeft()).map(function (s) { return '<div class="step"><b>' + esc(s.t) + '</b><span>' + esc(s.d) + '</span></div>'; }).join('');
      S.flash('考试日期已更新，复习计划已重排');
      if (window.MOTION) window.MOTION.refresh();
    });

    // 环形时间占比
    var svg = document.getElementById('donutSvg');
    if (svg) {
      var C = 2 * Math.PI * 70;
      var acc = 0;
      svg.querySelectorAll('.seg').forEach(function (c) {
        var id = c.dataset.id;
        var s = SUBS.filter(function (x) { return x.id === id; })[0];
        var len = C * (s.pct / 100);
        c.setAttribute('stroke-dasharray', Math.max(0, len - 4) + ' ' + (C - Math.max(0, len - 4)));
        c.setAttribute('stroke-dashoffset', (-acc).toFixed(1));
        acc += len;
        var t = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        t.textContent = s.name + ' ' + s.pct + '%';
        c.appendChild(t);
      });
    }

    // 打卡
    var ck = document.getElementById('check');
    if (ck) {
      var cnt = function () { var c = 0; Object.keys(checklist).forEach(function (k) { if (checklist[k]) c++; }); return c; };
      var numEl = document.getElementById('ckNum');
      if (numEl) numEl.textContent = cnt();
      ck.addEventListener('change', function (e) {
        var cb = e.target.closest('input[data-ck]');
        if (!cb) return;
        checklist[cb.dataset.ck] = cb.checked;
        LS.set(CHECK_KEY, checklist);
        cb.closest('.ckitem').classList.toggle('on', cb.checked);
        if (numEl) numEl.textContent = cnt();
        if (cb.checked) S.confetti();
      });
    }
    mountTrainer(document.getElementById('train') || document, 'all');
  }

  window.DASHBOARD = { html: html, mount: mount, trainerHTML: trainerHTML, mountTrainer: mountTrainer, SUBS: SUBS };
})();
