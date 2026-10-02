const {JSDOM, VirtualConsole} = require('jsdom');
const base='http://127.0.0.1:8123/';
const pages=['index.html','subjects/chinese.html','subjects/math.html','subjects/english.html','subjects/physics.html','subjects/chemistry.html','subjects/biology.html'];
(async()=>{
  for(const p of pages){
    const errs=[];
    const vc=new VirtualConsole();
    vc.on('jsdomError',e=>errs.push('jsdomError:'+e.message));
    vc.on('error',(...a)=>errs.push('console.error:'+String(a[0]).slice(0,200)));
    let dom;
    try{ dom=await JSDOM.fromURL(base+p,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,virtualConsole:vc}); }
    catch(e){ console.log(JSON.stringify({page:p,fatal:String(e.message)})); continue; }
    await new Promise(r=>setTimeout(r,1200));
    const d=dom.window.document, w=dom.window;
    const t=(s)=>{const e=d.querySelector(s);return e?e.textContent.trim():null;};
    const r={page:p,title:d.title.slice(0,40),nav:d.querySelectorAll('.navtabs a').length,
      sections:d.querySelectorAll('section.block').length,kcards:d.querySelectorAll('.kcard').length,
      vocabRows:d.querySelectorAll('table.tbl tbody tr').length,masters:d.querySelectorAll('.master').length,
      deck:d.querySelectorAll('.deckitem').length,quizQ:d.querySelectorAll('#quizBox .q').length,
      hasCard:!!d.querySelector('#fcCard'),fcQ:(t('#fcQ')||'').slice(0,26),errs:errs.slice(0,3)};
    if(r.hasCard){
      const card=d.querySelector('#fcCard');
      card.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
      r.flip=card.classList.contains('flipped');
      const b4=t('#fcQ');
      d.querySelector('#fcNext').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
      r.nextOK=t('#fcQ')!==b4;
      d.querySelector('#fcKnown').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
      r.knownMarked=(t('#fcProgLabel')||'').indexOf('1 /')>=0;
      d.querySelectorAll('#fcTags .tagchip')[1] && d.querySelectorAll('#fcTags .tagchip')[1].dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
      r.tagFilter=t('#fcTagA');
    }
    if(r.quizQ){
      d.querySelector('#quizBox .q .opt').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
      r.quizScored=(t('#quizScore')||'').indexOf('1 /')>=0;
      r.explain=d.querySelector('#quizBox .q .explain').classList.contains('show');
      r.rightMarked=!!d.querySelector('#quizBox .q .opt.right');
    }
    if(r.kcards){
      d.querySelector('.master').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
      r.progress=(t('#allProgLabel')||'');
    }
    console.log(JSON.stringify(r));
    w.close();
  }
})().catch(e=>{console.error('FATAL '+e.stack);process.exit(1);});
