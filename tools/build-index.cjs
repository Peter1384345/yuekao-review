const fs=require('fs'),path=require('path');
const dir=path.join(process.cwd(),'assets','js','data');
const subs=['chinese','math','english','physics','chemistry','biology'];
const errs=[],out=[];
for(const id of subs){
  try{
    const src=fs.readFileSync(path.join(dir,id+'.js'),'utf8');
    const w={}; new Function('window',src)(w);
    const d=w.SUBJECT_DATA;
    if(!d){errs.push(id+': no SUBJECT_DATA');continue;}
    if(!d.name) errs.push(id+': missing name');
    if(!d.range) errs.push(id+': missing range');
    if(!Array.isArray(d.blocks)||d.blocks.length<3) errs.push(id+': blocks<3');
    const ids=new Set();
    (d.blocks||[]).forEach((b,i)=>{
      if(!b.id||!b.title) errs.push(id+' block#'+i+' missing id/title');
      if(ids.has(b.id)) errs.push(id+' duplicate block id '+b.id); ids.add(b.id);
      if(!Array.isArray(b.items)||!b.items.length) errs.push(id+' block '+b.id+' no items');
      (b.items||[]).forEach((it,j)=>{
        if(b.kind==='vocab'){ if(!it.w||!it.cn) errs.push(id+' vocab '+b.id+'#'+j+' missing w/cn'); }
        else { if(!it.t||!it.d) errs.push(id+' item '+b.id+'#'+j+' missing t/d'); }
      });
    });
    if(!Array.isArray(d.flashcards)||d.flashcards.length<20) errs.push(id+': flashcards<20');
    (d.flashcards||[]).forEach((c,i)=>{ if(!c.q||!c.a) errs.push(id+' card#'+i+' missing q/a'); });
    if(!Array.isArray(d.quiz)||d.quiz.length<8) errs.push(id+': quiz<8');
    (d.quiz||[]).forEach((q,i)=>{
      if(!q.q) errs.push(id+' quiz#'+i+' missing q');
      if(!Array.isArray(q.options)||q.options.length<2) errs.push(id+' quiz#'+i+' options');
      if(typeof q.answer!=='number'||q.answer<0||q.answer>=(q.options||[]).length) errs.push(id+' quiz#'+i+' bad answer');
      if(!q.explain) errs.push(id+' quiz#'+i+' missing explain');
    });
    const items=(d.blocks||[]).reduce((a,b)=>a+b.items.length,0);
    out.push({id,name:d.name,emoji:d.emoji,accent:d.accent,range:d.range,slogan:d.slogan||'',cards:(d.flashcards||[]).length,quiz:(d.quiz||[]).length,blocks:(d.blocks||[]).length,items});
  }catch(e){ errs.push(id+': PARSE ERROR '+e.message); }
}
fs.writeFileSync(path.join(dir,'index.js'),'window.SUBJECT_INDEX = '+JSON.stringify(out,null,2)+';\n','utf8');
console.log(JSON.stringify({errs,summary:out.map(o=>o.id+': blocks='+o.blocks+' items='+o.items+' cards='+o.cards+' quiz='+o.quiz+' | '+o.range.slice(0,40))},null,1));
