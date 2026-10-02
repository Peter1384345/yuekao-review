const fs = require('fs'), path = require('path');
const REF = 'D:/DeepSeek harness/_ref/gao2/index.html';
const OUT = path.join(process.cwd(), 'assets', 'js', 'data', 'gao2');
fs.mkdirSync(OUT, { recursive: true });
const html = fs.readFileSync(REF, 'utf8');

const dec = (s) => String(s)
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&times;/g, '×').replace(/&middot;/g, '·')
  .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d));
const strip = (s) => dec(String(s).replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

const IDS = ['yuwen','shuxue','yingyu','wuli','huaxue','shengwu'];
const NAME = { yuwen:'chinese', shuxue:'math', yingyu:'english', wuli:'physics', huaxue:'chemistry', shengwu:'biology' };

function section(id) {
  const s = html.indexOf('id="view-' + id + '"');
  let end = html.length;
  for (const n of ['home','map','train', ...IDS]) {
    const p = html.indexOf('id="view-' + n + '"', s + 10);
    if (p > s && p < end) end = p;
  }
  return html.slice(s, end);
}
// 提取顶层对象字面量（按花括号配平）
function extractObject(name) {
  const m = new RegExp('\\b' + name + '\\s*=\\s*\\{').exec(html + html.slice(0, 1));
  if (!m) return null;
  const start = html.indexOf('{', m.index);
  let depth = 0, i = start, inStr = null, esc = false;
  for (; i < html.length; i++) {
    const c = html[i];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === inStr) inStr = null; continue; }
    if (c === "'" || c === '"' || c === '\`') { inStr = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { i++; break; } }
  }
  return html.slice(start, i);
}

const report = { subjects: {}, train: 0, map: null };

for (const id of IDS) {
  const sec = section(id);
  const h3s = [...sec.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/g)];
  const blocks = [], cards = [], seen = new Set();
  for (let k = 0; k < h3s.length; k++) {
    const title = strip(h3s[k][1]);
    const from = h3s[k].index + h3s[k][0].length;
    const to = k + 1 < h3s.length ? h3s[k + 1].index : sec.length;
    const body = sec.slice(from, to);
    const clean = title.replace(/（[^）]*）|\([^)]*\)/g, '').trim();

    // 闪卡
    const fcs = [...body.matchAll(/<div class="fc"[^>]*>([\s\S]*?)(?=<div class="fc"[^>]*>|<\/div>\s*<\/div>\s*<\/section|$)/g)];
    if (fcs.length) {
      for (const f of fcs) {
        const q = strip((f[1].match(/<div class="t">([\s\S]*?)<\/div>/) || [])[1] || '');
        const a = strip((f[1].match(/<div class="d">([\s\S]*?)<\/div>/) || [])[1] || '');
        const no = strip((f[1].match(/<span class="no">([\s\S]*?)<\/span>/) || [])[1] || '');
        if (q && a) cards.push({ q: a.length > 60 ? q : q, a, tag: clean.slice(0, 14), tip: no || '' });
      }
      continue;
    }
    // 表格
    if (/<table class="tbl">/.test(body)) {
      const th = [...body.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map(x => strip(x[1]));
      const rows = [...body.matchAll(/<tr>([\s\S]*?)<\/tr>/g)]
        .map(r => [...r[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(x => strip(x[1])))
        .filter(r => r.length);
      if (rows.length) {
        blocks.push({ id: 'f' + id + k, title: clean, icon: '📋', kind: 'table', cols: th.slice(1), intro: '',
          items: rows.map(r => ({ t: r[0], cells: r.slice(1) })) });
      }
      continue;
    }
    // 点题判读
    const qas = [...body.matchAll(/<details class="qa">([\s\S]*?)<\/details>/g)];
    if (qas.length) {
      for (const qa of qas) {
        const q = strip((qa[1].match(/<span class="q-t">([\s\S]*?)<\/span>/) || [])[1] || '');
        const a = strip((qa[1].match(/<div class="a">([\s\S]*?)<\/div>/) || [])[1] || '');
        if (q && a) cards.push({ q: q + '？（判断并说明理由）', a, tag: '点题判读·' + clean.slice(0, 8), tip: '' });
      }
      continue;
    }
    // 步骤
    const lis = [...body.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(x => strip(x[1])).filter(Boolean);
    if (lis.length) {
      blocks.push({ id: 's' + id + k, title: clean, icon: '🎯', kind: 'list',
        items: lis.map((t, i) => {
          const m = t.match(/^(.{1,12}?)[：:]([\s\S]+)$/);
          return m ? { t: m[1], d: m[2] } : { t: '第 ' + (i + 1) + ' 条', d: t };
        }) });
      continue;
    }
    // chips
    const chipBox = (body.match(/<div class="chips">([\s\S]*?)<\/div>/) || [])[1] || "";
    const chips = [...chipBox.matchAll(/<span[^>]*>([\s\S]*?)<\/span>/g)].map(x => strip(x[1])).filter(Boolean);
    if (chips.length) {
      blocks.push({ id: 'c' + id + k, title: clean, icon: '🔥', kind: 'list', items: chips.map(c => ({ t: c, d: '' })) });
      continue;
    }
    // warn
    const warn = strip((body.match(/<div class="warn">([\s\S]*?)<\/div>/) || [])[1] || '');
    if (warn) blocks.push({ id: 'w' + id + k, title: clean, icon: '⚠️', kind: 'list', items: [{ t: '易错提醒', d: warn.replace(/^易错提醒[：:]\s*/, '') }] });
  }
  const bad = (t) => !t || t.length > 30 || /['\"]\s*\+/.test(t) || /\+\s*s\./.test(t) || t.includes('${');
  const cleanBlocks = blocks.filter(b => !bad(b.title));
  const uniq = cards.filter(c => { const key = c.q + '|' + c.a; if (seen.has(key)) return false; seen.add(key); return true; });
  const payload = 'window.SUBJECT_EXTRA = ' + JSON.stringify({ blocks: cleanBlocks, flashcards: uniq }, null, 2) + ';\n';
  fs.writeFileSync(path.join(OUT, 'extra-' + NAME[id] + '.js'), payload, 'utf8');
  report.subjects[id] = { blocks: cleanBlocks.length, cards: uniq.length, kb: Math.round(payload.length / 1024) };
}

// 题库
const trainText = extractObject('TRAIN');
const TRAIN = new Function('return ' + trainText)();
const trainOut = {};
for (const id of IDS) {
  trainOut[NAME[id]] = (TRAIN[id] || []).map(t => t.type === 'j'
    ? { type: 'judge', q: t.q, answer: t.a === '对' ? true : false, explain: t.ex }
    : { type: 'single', q: t.q, options: (t.opts || []).map(o => o.replace(/^[A-D]\s*/, '')), answer: Math.max(0, 'ABCD'.indexOf(t.a)), explain: t.ex });
}
fs.writeFileSync(path.join(OUT, 'train.js'), 'window.SPRINT_TRAIN = ' + JSON.stringify(trainOut, null, 2) + ';\n', 'utf8');
report.train = Object.values(trainOut).reduce((a, b) => a + b.length, 0);

// 知识导图
const mapText = extractObject('MAP_DATA');
const MAP = mapText ? new Function('return ' + mapText)() : null;
const tipText = extractObject('MAP_TIPS');
const TIPS = tipText ? new Function('return ' + tipText)() : null;
if (MAP) {
  fs.writeFileSync(path.join(OUT, 'map.js'), 'window.SPRINT_MAP = ' + JSON.stringify({ data: MAP, tips: TIPS }, null, 2) + ';\n', 'utf8');
  report.map = { keys: Object.keys(MAP).slice(0, 8), tipKeys: TIPS ? Object.keys(TIPS).slice(0, 8) : null };
}
console.log(JSON.stringify(report, null, 1));
