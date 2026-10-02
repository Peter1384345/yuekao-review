const fs = require('fs'), path = require('path');
const SRC = 'D:/DeepSeek harness/_ref/hub/data';
const OUT = path.join(process.cwd(), 'assets', 'js', 'data', 'hub');
fs.mkdirSync(OUT, { recursive: true });
const SUBS = [['chinese','chinese'],['math','math'],['english','english'],['physics','physics'],['chemistry','chemistry'],['biology','biology']];
const KINDS = [['core',''],['enrich','enrich-'],['textbook','textbook-'],['toc','toc-']];
const report = { files: 0, kb: 0, points: 0, textbook: 0, modules: 0, periods: 0, tocSections: 0 };
for (const [id, file] of SUBS) {
  for (const [kind, pre] of KINDS) {
    const f = path.join(SRC, pre + file + '.json');
    if (!fs.existsSync(f)) { report[id + '-' + kind] = 'missing'; continue; }
    const j = JSON.parse(fs.readFileSync(f, 'utf8'));
    const g = 'HUB_' + kind.toUpperCase();
    const txt = 'window.' + g + ' = ' + JSON.stringify(j) + ';\n';
    fs.writeFileSync(path.join(OUT, id + '-' + kind + '.js'), txt, 'utf8');
    report.files++; report.kb += Math.round(txt.length / 1024);
    if (kind === 'core') {
      for (const pd of j.periods) {
        report.periods++;
        for (const m of pd.modules) {
          report.modules++;
          for (const k of ['keyPoints','difficultPoints','examPoints']) if (Array.isArray(m[k])) report.points += m[k].length;
        }
      }
    }
    if (kind === 'textbook') for (const k of Object.keys(j)) report.textbook += j[k].length;
    if (kind === 'toc') { const books = Array.isArray(j) ? j : Object.values(j).flat(); for (const bk of books) for (const u of (bk.units || [])) report.tocSections += (u.sections || []).length; }
  }
}
console.log(JSON.stringify(report, null, 1));
