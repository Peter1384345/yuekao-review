/* ==========================================================
   月考冲刺台 · 倒计时 / 复习计划 / 打卡 / 训练场 / 知识导图
   工具与题库来自 gao2-monthly-exam-review（原样移植，未改动源仓库）
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
  var DATE_KEY = 'sprint.examDate';
  var CHECK_KEY = 'sprint.checklist';
  var BEST_KEY = 'sprint.best';

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
    { t: '心态锚点', d: '开考前 3 分钟深呼吸，把「会做的全做对」写在草稿纸角落；遇到难题先跳，不让单题影响全局。' }
  ];

  var mapSub = 'math';
  var MAPKEY = { chinese: 'yuwen', math: 'shuxue', english: 'yingyu', physics: 'wuli', chemistry: 'huaxue', biology: 'shengwu' };
  var examDate = LS.get(DATE_KEY, '2026-10-09');
  var checklist = LS.get(CHECK_KEY, {});
  var best = LS.get(BEST_KEY, {});
  var trainSub = 'math';
  var trainSet = null, trainIdx = 0, trainRight = 0, trainDone = false;

  function daysLeft() {
    var t = new Date(examDate + 'T00:00:00');
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((t - today) / 86400000);
  }
  function planStages(n) {
    if (n < 0) return [{ t: '考试已过', d: '把这次月考的错题整理成册，比什么复习都值钱。' }];
    if (n <= 2) return [
      { t: '第 1 天 · 只背不练', d: '把六科的二级结论、默写、单词表、公式表过一遍，不再做新题。' },
      { t: '考前当晚 · 只看错题', d: '翻错题本与闪卡，22:30 前睡觉，保证第二天状态。' }
    ];
    if (n <= 6) return [
      { t: '前一半时间 · 专题补漏', d: '六科各挑 1—2 个最弱的板块，只看考点 + 闪卡 + 自测错题，不求面面俱到。' },
      { t: '后一半时间 · 限时套卷', d: '每科做一套限时卷，重点练时间分配与答题规范；做完只订正，不刷新题。' }
    ];
    var a = Math.max(2, Math.round(n * 0.3)), b = Math.max(2, Math.round(n * 0.3));
    return [
      { t: '第 1 阶段 · ' + a + ' 天：基础回归', d: '六科考点清单过一遍，用闪卡做主动回忆，把不会的标出来。语文默写、英语词块、化学热化学方程式的规范性优先。' },
      { t: '第 2 阶段 · ' + b + ' 天：专题突破', d: '按分值从高到低攻：数学空间向量 → 物理电场电路 → 化学平衡 → 其余。每科集中攻 2 个高频题型，做透比做多重要。' },
      { t: '第 3 阶段 · ' + Math.max(1, n - a - b - 2) + ' 天：套卷实战', d: '每科一套限时卷，严格按考试时间。重点不是分数，而是暴露「会做但丢分」的地方。' },
      { t: '考前 2 天 · 回炉', d: '只看错题本、二级结论、默写与单词表；不再做新题，调整作息到考试时间。' }
    ];
  }

  function render() {
    var app = document.getElementById('app');
    var n = daysLeft();
    var stages = planStages(n);
    var totalChecked = 0, totalTasks = 0;
    SUBS.forEach(function (s) { TASKS[s.id].forEach(function () { totalTasks++; }); });
    SUBS.forEach(function (s) { TASKS[s.id].forEach(function (_, i) { if (checklist[s.id + i]) totalChecked++; }); });

    app.innerHTML = S.topbar(null, 'sprint') +
      '<main class="wrap">' +
        '<div class="hero" style="padding:44px 0 22px">' +
          '<h1>🚀 <span class="grad">月考冲刺台</span></h1>' +
          '<p class="lead">倒计时、按剩余天数自动排布的复习计划、打卡清单、108 道考点训练题与六科知识导图。' +
          '工具与题库迁移自 <b>gao2-monthly-exam-review</b>，源仓库未做任何改动。</p>' +
        '</div>' +
        '<div class="chips">' +
          '<a href="#cd">⏳ 倒计时</a><a href="#plan">🗓️ 复习计划</a><a href="#time">📊 时间占比</a>' +
          '<a href="#check">✅ 打卡清单</a><a href="#exam">🎯 考场策略</a><a href="#train">🏋️ 训练场</a><a href="#map">🧭 知识导图</a>' +
        '</div>' +
        '<section class="block" id="cd"><div class="sec-head"><span class="ic">⏳</span><h2>月考倒计时</h2></div>' +
          '<div class="cdbox">' +
            '<div class="cdnum"><b id="cdNum">' + (n >= 0 ? n : 0) + '</b><span>天</span></div>' +
            '<div class="cdside"><p>' + (n > 0 ? '距离考试还有 <b>' + n + '</b> 天。' : n === 0 ? '今天就是考试日，稳住！' : '考试日期已过 ' + (-n) + ' 天，别忘了订正错题。') + '</p>' +
            '<label>考试日期：<input type="date" id="examDate" value="' + esc(examDate) + '"></label></div>' +
          '</div>' +
        '</section>' +
        '<section class="block" id="plan"><div class="sec-head"><span class="ic">🗓️</span><h2>复习计划 · 按剩余天数自动安排</h2></div>' +
          '<p class="sec-sub">剩余 <b>' + Math.max(0, n) + '</b> 天，自动划分为 ' + stages.length + ' 个阶段。</p>' +
          '<div class="steps">' + stages.map(function (s) { return '<div class="step"><b>' + esc(s.t) + '</b><span>' + esc(s.d) + '</span></div>'; }).join('') + '</div>' +
        '</section>' +
        '<section class="block" id="time"><div class="sec-head"><span class="ic">📊</span><h2>各科每日时间占比建议</h2></div>' +
          '<p class="sec-sub">按月考分值与提分性价比排序，每天总时长建议 4.5—5.5 小时。</p>' +
          '<div class="timebars">' + SUBS.map(function (s) {
            return '<div class="tb" style="--c:' + s.accent + '"><span class="tb-n">' + s.emoji + ' ' + s.name + '</span>' +
              '<div class="tb-track"><i style="width:' + (s.pct / 25 * 100) + '%"></i></div>' +
              '<span class="tb-p">' + s.pct + '%</span></div>';
          }).join('') + '</div>' +
        '</section>' +
        '<section class="block" id="check"><div class="sec-head"><span class="ic">✅</span><h2>打卡清单</h2></div>' +
          '<p class="sec-sub">共 ' + totalTasks + ' 项，已打卡 <b id="ckNum">' + totalChecked + '</b> 项。勾选状态保存在本机。</p>' +
          '<div class="checkgrid">' + SUBS.map(function (s) {
            return '<div class="ckcard" style="--c:' + s.accent + '"><h4>' + s.emoji + ' ' + s.name + '</h4>' +
              TASKS[s.id].map(function (t, i) {
                var k = s.id + i;
                return '<label class="ckitem' + (checklist[k] ? ' on' : '') + '"><input type="checkbox" data-ck="' + k + '"' + (checklist[k] ? ' checked' : '') + '><span>' + esc(t) + '</span></label>';
              }).join('') + '</div>';
          }).join('') + '</div>' +
        '</section>' +
        '<section class="block" id="exam"><div class="sec-head"><span class="ic">🎯</span><h2>考场临场策略</h2></div>' +
          '<p class="sec-sub">会做的全做对，就是超常发挥。</p>' +
          '<div class="cards">' + STRATEGY.map(function (s) {
            return '<article class="kcard"><h4>' + esc(s.t) + '</h4><p class="d">' + esc(s.d) + '</p></article>';
          }).join('') + '</div>' +
        '</section>' +
        '<section class="block" id="train"><div class="sec-head"><span class="ic">🏋️</span><h2>考点训练场</h2></div>' +
          '<p class="sec-sub">题库 = 冲刺站 36 题 + 本站 72 道自测，共 108 题。每轮随机抽 5 题，判断 + 单选混合，做完立即判分并给解析。</p>' +
          '<div class="sptabs" id="trainTabs">' + SUBS.map(function (s) {
            return '<button class="sptab' + (s.id === trainSub ? ' on' : '') + '" data-tsub="' + s.id + '" style="--c:' + s.accent + '">' + s.emoji + ' ' + s.name + '</button>';
          }).join('') + '</div>' +
          '<div class="fcmeta" style="margin:14px 0"><span class="fccounter" id="trainBest"></span>' +
          '<button class="btn primary" id="trainStart">🎲 抽 5 题开始</button></div>' +
          '<div id="trainBox"></div>' +
        '</section>' +
        '<section class="block" id="map"><div class="sec-head"><span class="ic">🧭</span><h2>六科知识导图</h2></div>' +
          '<p class="sec-sub">点击节点展开子节点；带 💡 的节点可查看提示。</p>' +
          '<div class="sptabs" id="mapTabs">' + SUBS.map(function (s) {
            return '<button class="sptab' + (s.id === mapSub ? ' on' : '') + '" data-msub="' + s.id + '" style="--c:' + s.accent + '">' + s.emoji + ' ' + s.name + '</button>';
          }).join('') + '</div>' +
          '<div id="mapBox" class="mapbox"></div>' +
        '</section>' +
      '</main>' +
      '<button class="totop" id="toTop">↑</button>';
    S.afterRender();
    bind();
    paintTrain();
    paintMap();
  }

  function bind() {
    var di = document.getElementById('examDate');
    di.addEventListener('change', function () {
      examDate = di.value || examDate;
      LS.set(DATE_KEY, examDate);
      var n = daysLeft();
      document.getElementById('cdNum').textContent = n >= 0 ? n : 0;
      S.flash('考试日期已更新');
      render();
    });
    document.getElementById('check').addEventListener('change', function (e) {
      var cb = e.target.closest('input[data-ck]');
      if (!cb) return;
      checklist[cb.dataset.ck] = cb.checked;
      LS.set(CHECK_KEY, checklist);
      cb.closest('.ckitem').classList.toggle('on', cb.checked);
      var c = 0;
      Object.keys(checklist).forEach(function (k) { if (checklist[k]) c++; });
      document.getElementById('ckNum').textContent = c;
      if (cb.checked) S.confetti();
    });
    document.getElementById('trainTabs').addEventListener('click', function (e) {
      var b = e.target.closest('[data-tsub]');
      if (!b) return;
      trainSub = b.dataset.tsub;
      document.querySelectorAll('#trainTabs .sptab').forEach(function (x) { x.classList.toggle('on', x === b); });
      trainSet = null;
      paintTrain();
    });
    document.getElementById('trainStart').addEventListener('click', startTrain);
    document.getElementById('mapTabs').addEventListener('click', function (e) {
      var b = e.target.closest('[data-msub]');
      if (!b) return;
      mapSub = b.dataset.msub;
      document.querySelectorAll('#mapTabs .sptab').forEach(function (x) { x.classList.toggle('on', x === b); });
      paintMap();
    });
  }

  /* ---------- 训练场 ---------- */
  function pool(sub) {
    var out = [];
    var t = (window.SPRINT_TRAIN || {})[sub] || [];
    t.forEach(function (q) { out.push({ kind: q.type, q: q.q, options: q.options, a: q.answer, ex: q.explain, src: '冲刺站' }); });
    var aq = (window.ALL_QUIZ || {})[sub];
    if (aq) aq.quiz.forEach(function (q) { out.push({ kind: 'single', q: q.q, options: q.options, a: q.answer, ex: q.explain, src: '本站自测' }); });
    return out;
  }
  function startTrain() {
    var p = pool(trainSub);
    for (var i = p.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = p[i]; p[i] = p[j]; p[j] = t; }
    trainSet = p.slice(0, Math.min(5, p.length));
    trainIdx = 0; trainRight = 0; trainDone = false;
    paintTrain();
  }
  function paintTrain() {
    var box = document.getElementById('trainBox');
    var bEl = document.getElementById('trainBest');
    var rec = best[trainSub];
    bEl.textContent = (rec != null ? '本科最高分：' + rec + ' / 5　·　' : '') + '题库 ' + pool(trainSub).length + ' 题';
    if (!trainSet) { box.innerHTML = '<div class="hubload">点「抽 5 题开始」进入训练。</div>'; return; }
    if (trainIdx >= trainSet.length) {
      var txt = '本轮得分 ' + trainRight + ' / ' + trainSet.length;
      if (best[trainSub] == null || trainRight > best[trainSub]) { best[trainSub] = trainRight; LS.set(BEST_KEY, best); }
      box.innerHTML = '<div class="trainend"><h3>🎉 ' + txt + '</h3><p>本科最高分：' + best[trainSub] + ' / 5</p>' +
        '<button class="btn primary" id="trainAgain">再来一轮</button></div>';
      document.getElementById('trainAgain').addEventListener('click', startTrain);
      S.confetti();
      return;
    }
    var q = trainSet[trainIdx];
    var opts = '';
    if (q.kind === 'judge') {
      opts = '<button class="opt" data-j="1">对</button><button class="opt" data-j="0">错</button>';
    } else {
      opts = (q.options || []).map(function (o, i) {
        return '<button class="opt" data-j="' + i + '">' + 'ABCD'.charAt(i) + '. ' + esc(o) + '</button>';
      }).join('');
    }
    box.innerHTML = '<div class="q"><div class="qt"><em>Q' + (trainIdx + 1) + '</em>' + esc(q.q) +
      '<span class="src">' + esc(q.src) + (q.kind === 'judge' ? ' · 判断题' : ' · 单选') + '</span></div>' +
      '<div class="opts" id="trainOpts">' + opts + '</div>' +
      '<div class="explain" id="trainEx"><b>解析：</b>' + esc(q.ex) + '</div></div>';
    document.getElementById('trainOpts').addEventListener('click', function (e) {
      var b = e.target.closest('.opt');
      if (!b || b.disabled) return;
      var chosen = b.dataset.j === '1' && q.kind === 'judge' ? true : (q.kind === 'judge' ? false : +b.dataset.j);
      var ans = q.a;
      document.querySelectorAll('#trainOpts .opt').forEach(function (x) {
        x.disabled = true;
        var v = q.kind === 'judge' ? (x.dataset.j === '1') : +x.dataset.j;
        if (v === ans) x.classList.add('right');
        else if (v === chosen) x.classList.add('wrong');
      });
      document.getElementById('trainEx').classList.add('show');
      if (chosen === ans) trainRight++;
      setTimeout(function () { trainIdx++; paintTrain(); }, 1100);
    });
  }

  /* ---------- 思维导图 ---------- */
  function paintMap() {
    var box = document.getElementById('mapBox');
    var M = window.SPRINT_MAP;
    var mk = MAPKEY[mapSub] || mapSub;
    if (!M || !M.data || !M.data[mk]) { box.innerHTML = '<div class="hubload">导图数据缺失。</div>'; return; }
    var tips = M.tips || {};
    function node(n, depth) {
      var kids = n.children || [];
      var tip = tips[n.name];
      return '<li class="mn d' + depth + '">' +
        '<span class="mn-t' + (kids.length ? ' has' : '') + '"' + (tip ? ' data-tip="' + esc(tip) + '"' : '') + '>' +
        (kids.length ? '<i class="caret">▸</i>' : '<i class="leaf">•</i>') + esc(n.name) + (tip ? ' <em>💡</em>' : '') + '</span>' +
        (kids.length ? '<ul class="mn-kids">' + kids.map(function (c) { return node(c, depth + 1); }).join('') + '</ul>' : '') +
        '</li>';
    }
    box.innerHTML = '<ul class="mtree">' + node(M.data[mk], 0) + '</ul>';
    box.querySelectorAll('.mn-t.has').forEach(function (t) {
      t.addEventListener('click', function () {
        var li = t.parentElement;
        li.classList.toggle('open');
        t.querySelector('.caret').textContent = li.classList.contains('open') ? '▾' : '▸';
      });
    });
    box.querySelectorAll('.mn-t').forEach(function (t) {
      t.addEventListener('click', function () {
        var tip = t.dataset.tip;
        if (!tip) return;
        var old = document.querySelector('.maptip');
        if (old) old.remove();
        var d = document.createElement('div');
        d.className = 'maptip';
        d.innerHTML = '<b>💡 ' + esc(t.textContent.replace(/[▸▾•💡\s]+/g, ' ').trim()) + '</b><p>' + esc(tip) + '</p>';
        box.insertBefore(d, box.firstChild);
      });
    });
    box.querySelectorAll('.mn-t.has')[0] && box.querySelectorAll('.mn-t.has')[0].parentElement.classList.add('open');
  }

  render();
})();
