export const clone=x=>structuredClone(x);
export const en=x=>typeof x==='object'?(x?.en||''):String(x??'');
export const ar=x=>typeof x==='object'?(x?.ar||''):'';
export const text=(en='',ar='')=>({en,ar});
export const targets=m=>m?[...m.atoms.map(a=>a.id),...m.bonds.map(b=>b.id),...m.atoms.filter(a=>a.charge).map(a=>'charge:'+a.id),...m.atoms.filter(a=>a.partialCharge).map(a=>'partial:'+a.id),...(m.charge?['net-charge']:[])]:[];
export const allQuestions=c=>c.chapters.flatMap(ch=>[...(ch.learn||[]).flatMap(x=>x.checks||[]),...ch.skills.flatMap(x=>x.questions),...(ch.challenge||[]).flatMap(x=>x.questions)]);
export function createSession(){return {solved:new Set(),seen:new Set(),attempts:{},first:{},assisted:new Set(),hints:new Set(),revealed:new Set()};}
export function revealAnswer(s,q){if(s.solved.has(q.id))return; s.revealed.add(q.id);s.hints.add(q.id);}
export function answerQuestion(s,q,values){
 if(s.solved.has(q.id))return {ignored:true};
 const v=[...new Set(Array.isArray(values)?values:[values])];if(!v.length)return {ignored:true};
 const correct=v.length===q.answer.length&&v.every(x=>q.answer.includes(x));
 s.attempts[q.id]=(s.attempts[q.id]||0)+1;
 if(s.attempts[q.id]===1)s.first[q.id]=correct&&!s.hints.has(q.id);
 if(correct){s.solved.add(q.id);if(!s.first[q.id])s.assisted.add(q.id);}
 return {correct,explanation:q.explanation,wrong:v.filter(x=>!q.answer.includes(x)).map(x=>q.wrong?.[x]).filter(Boolean)};
}
export function progress(s,qs){const total=qs.length,done=qs.filter(q=>s.solved.has(q.id)).length;return {total,done,percent:total?Math.round(100*done/total):0,first:qs.filter(q=>s.first[q.id]).length,assisted:qs.filter(q=>s.assisted.has(q.id)).length};}
export function resonanceForm(original,v=0){const m=clone(original);if(m.id==='acetate'){v%=2;m.bonds[1].order=v?1:2;m.bonds[2].order=v?2:1;m.atoms[2].charge=v?-1:0;m.atoms[3].charge=v?0:-1;}if(m.id==='carbonate'){v%=3;m.bonds.forEach((b,i)=>b.order=i===v?2:1);m.atoms.slice(1).forEach((a,i)=>a.charge=i===v?0:-1);}return m;}
export function describeTarget(m,id){
 if(id==='net-charge')return {title:text('Net charge · '+charge(m.charge)),body:text('The charge of the whole drawn species is the sum of its formal charges. A subscript counts atoms; a superscript marks charge.','هذه الشحنة الكلية للنوع المرسوم؛ مجموع Formal charges. الرقم السفلي يعد الذرات والعلوي يبين الشحنة.')};
 if(id.startsWith('partial:')){const atom=m.atoms.find(a=>a.id===id.slice(8));return {title:text(atom?.element+' · partial charge δ'+(atom?.partialCharge===1?'+':'−')),body:text('A partial charge describes unequal sharing of a bonding electron pair. It is not an integer formal charge and is not added to the molecule’s formal-charge sum. The δ− label marks the more electron-rich end; δ+ marks the more electron-poor end.','Partial charge تنتج من المشاركة غير المتساوية لإلكترونات الرابطة، وليست Formal charge صحيحة كاملة. δ− تعني الطرف الأكثر غنى بالإلكترونات وδ+ الطرف الأقل غنى.')}};
 const isCharge=id.startsWith('charge:'),a=m.atoms.find(x=>x.id===(isCharge?id.slice(7):id));
 if(a){const links=m.bonds.filter(b=>b.from===a.id||b.to===a.id),sum=links.reduce((n,b)=>n+b.order,0)+(a.hydrogens||0);
 if(isCharge){const valence={H:1,C:4,N:5,O:6,F:7,Cl:7,Br:7,I:7,S:6,P:5}[a.element],nonbonding=valence-a.charge-sum;return {title:text(a.element+' · formal charge '+charge(a.charge)),body:text('Formal charge assigns half of each bond’s electrons to this atom. For this '+a.element+': '+valence+' valence electrons − '+nonbonding+' nonbonding electrons − '+sum+' assigned bonding electrons = '+a.charge+'. The label is '+charge(a.charge)+'. It is not a count of attached atoms or necessarily the charge of the entire molecule. A resonance contributor can place this label differently.','Formal charge تنتج من عد الإلكترونات مع تقسيم إلكتروني كل رابطة بالتساوي. ليست عدد الذرات ولا بالضرورة شحنة الجزيء كله. قد يتغير موضعها بين Resonance contributors.')};}
 const title=a.element==='Ar'?'Ar · aromatic group':a.element+' · atom '+a.id;
 return {title:text(title),body:text(a.element==='Ar'?'Ar abbreviates an aromatic group in this fragment; it is not an argon atom.':`${a.element} has ${links.length} explicitly drawn neighbor(s) and ${a.hydrogens||0} implicit H. Total bond order including implicit H: ${sum}. Formal charge: ${charge(a.charge)}. ${a.element==='C'&&sum===4&&!a.charge?'Four shared bond-order units give this neutral carbon an octet; adding a fifth ordinary bond is not allowed in this second-row structure.':''}`,'افحص اتصال الذرة بالجيران. مجموع رتب الروابط يشمل H المضمّنة؛ عدد الروابط وValence electrons وFormal charge مفاهيم مختلفة.')};}
 const b=m.bonds.find(x=>x.id===id);if(b)return {title:text(['','Single bond','Double bond','Triple bond'][b.order]),body:text(['','One line represents a shared electron pair: one σ bond.','Two lines represent two shared electron pairs: one σ and one π bond.','Three lines represent three shared pairs: one σ and two π bonds.'][b.order]+(['acetate','carbonate'].includes(m.id)?' This is one resonance contributor; the real resonance-group C–O bonds are equivalent.':''),['','رابطة أحادية: زوج مشترك واحد، σ.','رابطة ثنائية: زوجان مشتركان، σ وπ.','رابطة ثلاثية: ثلاثة أزواج مشتركة، σ واثنتان π.'][b.order])};
 return {title:text('Feature'),body:text('Select an atom, bond or charge.')};
}
export const charge=n=>n===0?'0':(Math.abs(n)===1?'':Math.abs(n))+(n>0?'+':'−');
export function validAsset(p){return !p||(/^assets\/[a-zA-Z0-9_./-]+\.(mp3|wav|ogg|m4a)$/i.test(p)&&!p.split('/').includes('..'));}
export function validate(c){
 const E=[],ids=new Set();if(c?.format!=='myrto-organic-v2'||!Array.isArray(c.chapters)||!c.molecules)return ['Unsupported course format. Use a version 0.2 course export.'];
 const id=(x,where)=>{if(!x||typeof x!=='string'||!/^[\w-]+$/.test(x)||ids.has(x))E.push(where+': missing, invalid or duplicate ID '+x);ids.add(x);};
 const audio=(o,label)=>{for(const p of Object.values(o.audio||{}))if(!validAsset(p))E.push(label+': audio must be a safe local assets/ path.');};
 const source=(o,label)=>{if(!o.source)return;const s=c.sources?.find(s=>s.id===o.source);if(!s||(o.pages||[]).some(p=>!Number.isInteger(p)||p<1||p>s.pages))E.push(label+': invalid source/page.');};
 const full=(o,active)=>active&&o.status==='published';
 for(const [key,m] of Object.entries(c.molecules)){
  if(key!==m.id)E.push(key+': molecule key differs from ID');id(m.id,'Molecule');audio(m,m.id);source(m,m.id);
  if(!Array.isArray(m.atoms)||!m.atoms.length||!Array.isArray(m.bonds)){E.push(m.id+': graph missing');continue;}
  const ai=m.atoms.map(a=>a.id),bi=m.bonds.map(b=>b.id);if(new Set([...ai,...bi]).size!==ai.length+bi.length)E.push(m.id+': duplicate graph IDs');
  for(const a of m.atoms)if(!/^[A-Za-z][A-Za-z]?$/.test(a.element)||!Number.isFinite(a.x)||!Number.isFinite(a.y)||!Number.isInteger(a.hydrogens)||a.hydrogens<0||!Number.isInteger(a.charge)||(a.partialCharge!==undefined&&![0,1,-1].includes(a.partialCharge))||!a.element)E.push(m.id+': invalid atom '+a.id);
  for(const b of m.bonds)if(!ai.includes(b.from)||!ai.includes(b.to)||b.from===b.to||![1,2,3].includes(b.order))E.push(m.id+': invalid bond '+b.id);
  if(m.atoms.reduce((n,a)=>n+a.charge,0)!==m.charge)E.push(m.id+': formal-charge sum differs from net charge');
  for(const an of m.annotations||[]){if(!an.targets?.length||an.targets.some(t=>!targets(m).includes(t)))E.push(m.id+': annotation has invalid target');if(an.status==='published'&&(!en(an.title)||!en(an.body)))E.push(m.id+': published feature explanation needs an English title and body');}
 }
 const q=(q,active)=>{id(q.id,'Question');audio(q,q.id);source(q,q.id);if(q.molecule&&!c.molecules[q.molecule])E.push(q.id+': missing molecule');if(!full(q,active))return;
  if(!en(q.prompt)||!en(q.explanation))E.push(q.id+': published question needs English question and explanation');
  const allowed=q.kind==='choice'?(q.choices||[]).map(o=>o.id):targets(c.molecules[q.molecule]);
  if(q.kind==='choice'&&(allowed.length<2||new Set(allowed).size!==allowed.length||(q.choices||[]).some(x=>!en(x.label))))E.push(q.id+': choices need unique IDs and text');
  if(!['choice','pick'].includes(q.kind)||!Array.isArray(q.answer)||!q.answer.length||new Set(q.answer).size!==q.answer.length||q.answer.some(x=>!allowed.includes(x)))E.push(q.id+': invalid answer target(s)');
  if(q.molecule&&c.molecules[q.molecule]?.status!=='published')E.push(q.id+': published question references a draft molecule');
 };
 for(const ch of c.chapters){id(ch.id,'Chapter');const active=ch.status==='published';if(active&&!en(ch.title))E.push(ch.id+': missing title');
  for(const l of ch.learn||[]){id(l.id,'Learn card');audio(l,l.id);source(l,l.id);if(l.molecule&&!c.molecules[l.molecule])E.push(l.id+': missing molecule');if(full(l,active)&&(!en(l.title)||!en(l.body)))E.push(l.id+': published card needs title and body');if(full(l,active)&&l.molecule&&c.molecules[l.molecule]?.status!=='published')E.push(l.id+': draft molecule in published card');for(const t of l.checks||[])q(t,full(l,active));}
  for(const s of ch.skills||[]){id(s.id,'Skill');for(const t of s.questions||[])q(t,full(s,active));}
  for(const ca of ch.challenge||[]){id(ca.id,'Case');if(ca.molecule&&!c.molecules[ca.molecule])E.push(ca.id+': missing case molecule');for(const t of ca.questions||[]){q(t,full(ca,active));if(t.skillId&&!ch.skills.some(s=>s.id===t.skillId))E.push(t.id+': unknown linked skill');}}
 }
 if(c.settings?.homeUrl&&!/^https:\/\/[^\s]+$/.test(c.settings.homeUrl))E.push('Home URL must be HTTPS or empty.');
 return E;
}
export function publishCourse(course,{drafts=false}={}){
 const c=clone(course),ok=x=>drafts||x.status==='published',refs=new Set();
 c.chapters=c.chapters.filter(ok).map(ch=>({...ch,learn:(ch.learn||[]).filter(ok).map(l=>({...l,checks:(l.checks||[]).filter(ok)})),skills:ch.skills.filter(ok).map(s=>({...s,questions:s.questions.filter(ok)})),challenge:(ch.challenge||[]).filter(ok).map(s=>({...s,questions:s.questions.filter(ok)}))}));
 for(const ch of c.chapters){for(const l of ch.learn)if(l.molecule)refs.add(l.molecule);for(const ca of ch.challenge)if(ca.molecule)refs.add(ca.molecule);}
 for(const q of allQuestions(c))if(q.molecule)refs.add(q.molecule);
 c.molecules=Object.fromEntries(Object.entries(c.molecules).filter(([id,m])=>refs.has(id)&&ok(m)).map(([id,m])=>[id,{...m,annotations:(m.annotations||[]).filter(ok)}]));
 return c;
}
export function audioPaths(c){const out=new Set();const walk=v=>{if(!v||typeof v!=='object')return;for(const [k,x]of Object.entries(v)){if(k==='audio')for(const p of Object.values(x||{}))if(p)out.add(p);else{}else walk(x);}};walk(c);return [...out];}
