import {en,ar,charge,describeTarget,resonanceForm} from './model.js';
export const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const bilingual=(x,cls='')=>`<div class="${cls}"><div>${esc(en(x)).replace(/\n/g,'<br>')}</div>${ar(x)?`<p class="arabic" dir="rtl">${esc(ar(x)).replace(/\n/g,'<br>')}</p>`:''}</div>`;
const sub=n=>String(n).replace(/[0-9]/g,d=>'₀₁₂₃₄₅₆₇₈₉'[d]);
export function mountMolecule(host,original,opts={}){
 let m=structuredClone(original),labels=false,zoom=1,angle=0,variant=0,selected=new Set(opts.selected||[]),popover=null,answerTargets=new Set(opts.answerTargets||[]),answerLocked=Boolean(opts.readOnly),laser=false,laserColor='#5da9ff',disposeLaser=()=>{};
 host.classList.add('molecule-host');
 const nodes=()=>m.atoms;
 function render(){
  disposeLaser();
  host.innerHTML=`<div class="molecule-top"><div><strong>${esc(m.name)}</strong><span class="formula">${esc(m.formula||'')}</span></div><span class="pill">${m.origin==='chapter'?'Course-linked example':'Extra example'}${m.id.includes('fragment')?' · fragment':''}</span></div><div class="molecule-tools"><button data-tool="labels" aria-pressed="${labels}">C/H labels</button><button data-tool="in" aria-label="Zoom in">＋</button><button data-tool="out" aria-label="Zoom out">−</button><button data-tool="rotate">Rotate ↻</button><button data-tool="fit">Reset view</button><button data-tool="laser" aria-pressed="${laser}" aria-label="Toggle temporary laser pen" title="Draw temporarily without selecting the molecule">✎ Laser</button><span class="laser-colors" ${laser?'':'hidden'}><button data-laser-color="#5da9ff" aria-pressed="${laserColor==='#5da9ff'}" aria-label="Blue laser" class="laser-blue">Blue</button><button data-laser-color="#ff6576" aria-pressed="${laserColor==='#ff6576'}" aria-label="Red laser" class="laser-red">Red</button></span>${['acetate','carbonate'].includes(m.id)&&!opts.selectOnly?'<button data-tool="resonance">Resonance contributor</button>':''}</div><div class="molecule-canvas"><svg role="group" aria-label="Interactive structure of ${esc(m.name)}" viewBox="0 0 640 410" tabindex="0"></svg></div><div class="structure-note">${opts.selectOnly?'Select targets on the structure. Use Check selection when ready.':'Tap an atom, bond or charge to explore. This does not affect your score.'}</div>${opts.selectOnly?'':bilingual(m.note,'molecule-note')}<details class="target-list"><summary>Accessible target list</summary><div class="target-buttons"></div></details>`;
  const svg=host.querySelector('svg'),canvas=host.querySelector('.molecule-canvas');
  const xs=nodes().map(a=>a.x),ys=nodes().map(a=>a.y),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
  const sc=Math.min(1.4,490/Math.max(100,Math.max(...xs)-Math.min(...xs)),270/Math.max(100,Math.max(...ys)-Math.min(...ys)))*zoom;
  const map=a=>{const x=(a.x-cx)*sc,y=(a.y-cy)*sc,r=angle*Math.PI/180;return {x:320+x*Math.cos(r)-y*Math.sin(r),y:205+x*Math.sin(r)+y*Math.cos(r)};};
  let content='';const items=[];
  for(const b of m.bonds){const a=map(m.atoms.find(a=>a.id===b.from)),z=map(m.atoms.find(a=>a.id===b.to)),dx=z.x-a.x,dy=z.y-a.y,len=Math.hypot(dx,dy),px=-dy/len*5,py=dx/len*5;
   const offsets=b.order===1?[0]:b.order===2?[-.65,.65]:[-1,0,1];
   content+=`<g data-target="${esc(b.id)}" role="button" tabindex="0" aria-label="Bond ${esc(b.id)}${opts.selectOnly?'':': '+['','single','double','triple'][b.order]}" class="bond ${selected.has(b.id)?'selected':''} ${answerTargets.has(b.id)?'answer-target':''}"><line class="hit" x1="${a.x}" y1="${a.y}" x2="${z.x}" y2="${z.y}"/>${offsets.map(k=>`<line x1="${a.x+px*k}" y1="${a.y+py*k}" x2="${z.x+px*k}" y2="${z.y+py*k}"/>`).join('')}</g>`;items.push([b.id,`Bond ${b.id}: ${b.from}–${b.to}`]);}
  for(const a of nodes()){const p=map(a),show=labels||a.element!=='C',label=a.element+(a.hydrogens&&(labels||a.element!=='C')?'H'+(a.hydrogens>1?sub(a.hydrogens):''):'');
   content+=`<g data-target="${esc(a.id)}" role="button" tabindex="0" aria-label="${esc(a.element)} atom ${esc(a.id)}" class="atom ${selected.has(a.id)?'selected':''} ${answerTargets.has(a.id)?'answer-target':''}"><circle class="atom-hit" cx="${p.x}" cy="${p.y}" r="20"/>${show?`<rect class="atom-bg" x="${p.x-label.length*6-3}" y="${p.y-14}" width="${label.length*12+6}" height="28" rx="6"/><text x="${p.x}" y="${p.y+7}" class="element-${esc(a.element)}">${esc(label)}</text>`:`<circle class="vertex" cx="${p.x}" cy="${p.y}" r="3.5"/>`}</g>`;
   items.push([a.id,`${a.element} atom ${a.id}`]);
   if(a.charge||a.partialCharge){const id=(a.charge?'charge:':'partial:')+a.id,displayCharge=a.charge?charge(a.charge):'δ'+(a.partialCharge>0?'+':'−');content+=`<g data-target="${id}" role="button" tabindex="0" aria-label="${a.charge?'Formal':'Partial'} charge ${displayCharge} on ${a.id}" class="charge ${selected.has(id)?'selected':''} ${answerTargets.has(id)?'answer-target':''}"><rect x="${p.x+15}" y="${p.y-34}" width="29" height="27" rx="10"/><text x="${p.x+29}" y="${p.y-14}">${displayCharge}</text></g>`;items.push([id,`${a.charge?'Formal':'Partial'} charge on ${a.id}`]);}}
  if(m.charge){content+=`<g data-target="net-charge" tabindex="0" role="button" aria-label="Net charge ${charge(m.charge)}" class="charge ${selected.has('net-charge')?'selected':''} ${answerTargets.has('net-charge')?'answer-target':''}"><rect x="516" y="20" width="102" height="32" rx="12"/><text x="567" y="42">Net ${charge(m.charge)}</text></g>`;items.push(['net-charge','Overall ion charge']);}
  svg.innerHTML=content;host.querySelector('.target-buttons').innerHTML=items.map(([id,label])=>`<button data-target="${esc(id)}" aria-pressed="${selected.has(id)}" class="${answerTargets.has(id)?'answer-correct':''}">${esc(label)}${answerTargets.has(id)?' · correct':''}</button>`).join('');
  for(const el of host.querySelectorAll('[data-target]')){el.onclick=()=>activate(el.dataset.target,el);if(el.tagName.toLowerCase()==='g')el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate(el.dataset.target,el);}};}
  disposeLaser=attachLaser(canvas,()=>laser,()=>laserColor);
  for(const el of host.querySelectorAll('[data-laser-color]'))el.onclick=()=>{laserColor=el.dataset.laserColor;host.querySelectorAll('[data-laser-color]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.laserColor===laserColor)));};
  for(const el of host.querySelectorAll('[data-tool]'))el.onclick=()=>{const t=el.dataset.tool;if(t==='laser'){laser=!laser;popover?.remove();host.querySelector('.laser-colors').hidden=!laser;el.setAttribute('aria-pressed',String(laser));canvas.classList.toggle('laser-active',laser);host.querySelector('.structure-note').textContent=laser?'Laser on · drawing fades after 2 seconds. Turn it off to select the structure.':(opts.selectOnly?'Select targets on the structure. Use Check selection when ready.':'Tap an atom, bond or charge to explore. This does not affect your score.');return;}if(t==='labels')labels=!labels;if(t==='in')zoom=Math.min(2,zoom+.2);if(t==='out')zoom=Math.max(.55,zoom-.2);if(t==='rotate')angle+=30;if(t==='fit'){zoom=1;angle=0;}if(t==='resonance'){variant++;m=resonanceForm(original,variant);}render();};
  canvas.classList.toggle('laser-active',laser);
  function activate(id,el){if(laser||answerLocked)return;if(opts.selectOnly){if(selected.has(id))selected.delete(id);else selected.add(id);opts.onSelect?.([...selected],id);render();return;}showInfo(id,el,canvas);opts.onExplore?.(id);}
 }
 function showInfo(id,el,canvas){popover?.remove();let info=describeTarget(m,id);const ann=(m.annotations||[]).find(a=>a.targets.includes(id));if(ann&&(variant===0||!id.startsWith('charge:')))info=ann;
  popover=document.createElement('div');popover.className='atom-popover';popover.setAttribute('role','dialog');popover.setAttribute('aria-label',en(info.title));popover.innerHTML=`<button class="close" aria-label="Close explanation">×</button><span class="eyebrow">STRUCTURE EXPLORER</span><h3>${esc(en(info.title))}</h3><div class="popover-body">${bilingual(info.body)}</div>`;canvas.append(popover);
  const box=canvas.getBoundingClientRect(),r=el.getBoundingClientRect(),width=Math.min(340,box.width-24),anchor=Math.min(box.width-12,Math.max(12,r.left+r.width/2-box.left));
  popover.style.width=width+'px';const left=Math.max(12,Math.min(box.width-width-12,anchor-width/2));popover.style.left=left+'px';let top=r.bottom-box.top+16;
  if(top+popover.offsetHeight>box.height){top=Math.max(8,r.top-box.top-popover.offsetHeight-15);popover.classList.add('above');}
  popover.style.top=top+'px';popover.style.setProperty('--arrow',Math.min(width-20,Math.max(20,anchor-left))+'px');
  const close=()=>{popover?.remove();popover=null;el.focus?.();};popover.querySelector('button').onclick=close;popover.onkeydown=e=>{if(e.key==='Escape')close();};popover.querySelector('button').focus();
 }
 render();return {selection:()=>[...selected],clear(){selected.clear();render();},setSelected(v){selected=new Set(v);render();},explain(id){const el=host.querySelector(`[data-target="${CSS.escape(id)}"]`);if(el)showInfo(id,el,host.querySelector('.molecule-canvas'));}};
}

// Ephemeral drawing is a separate pointer layer; never writes into the molecule or answer data.
export function attachLaser(canvas,isEnabled,getColor){
 const layer=document.createElementNS('http://www.w3.org/2000/svg','svg');layer.setAttribute('class','laser-overlay');layer.setAttribute('aria-hidden','true');canvas.append(layer);
 let pointer=null,last=null;const timers=new Set();
 const point=e=>{const r=layer.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};};
 const segment=(a,b)=>{const line=document.createElementNS('http://www.w3.org/2000/svg','line');for(const[k,v]of Object.entries({x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:getColor(),'stroke-width':3.5,'stroke-linecap':'round','class':'laser-trail'}))line.setAttribute(k,v);layer.append(line);const timer=setTimeout(()=>{line.remove();timers.delete(timer);},2000);timers.add(timer);};
 layer.onpointerdown=e=>{if(!isEnabled()||pointer!==null||(e.pointerType==='mouse'&&e.button!==0))return;e.preventDefault();e.stopPropagation();pointer=e.pointerId;last=point(e);layer.setPointerCapture?.(pointer);segment(last,{x:last.x+.01,y:last.y});};
 layer.onpointermove=e=>{if(e.pointerId!==pointer||!last||!isEnabled())return;e.preventDefault();const next=point(e);segment(last,next);last=next;};
 const end=e=>{if(e.pointerId!==pointer)return;try{layer.releasePointerCapture?.(pointer);}catch{}pointer=null;last=null;};
 layer.onpointerup=end;layer.onpointercancel=end;layer.onlostpointercapture=end;
 layer.onclick=e=>{e.preventDefault();e.stopPropagation();};
 return ()=>{for(const t of timers)clearTimeout(t);timers.clear();layer.remove();};
}
