const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// run decorative animations only while their block is on screen
const inView = new WeakMap(), waiters = new WeakMap();
const viewIO = new IntersectionObserver(es => es.forEach(e => {
  inView.set(e.target, e.isIntersecting); e.target.classList.toggle('inview', e.isIntersecting);
  if (e.isIntersecting && waiters.get(e.target)) { waiters.get(e.target)(); waiters.delete(e.target); }
}), {threshold: .15});
const watch = el => { if (el) viewIO.observe(el); return el; };
const whenVisible = el => inView.get(el) ? Promise.resolve() : new Promise(r => waiters.set(el, r));

// mobile menu
const hdr = document.querySelector('header'), burger = document.querySelector('.burger');
const setMenu = o => {
  hdr.classList.toggle('open', o); document.body.classList.toggle('menu-lock', o);
  burger.setAttribute('aria-expanded', o); burger.setAttribute('aria-label', o ? 'Закрыть меню' : 'Открыть меню');
};
burger.addEventListener('click', () => setMenu(!hdr.classList.contains('open')));
document.querySelectorAll('.mmenu a').forEach(a => a.addEventListener('click', e => {
  const href = a.getAttribute('href');
  setMenu(false);
  if (href.startsWith('#')) {
    e.preventDefault();
    const t = document.querySelector(href);
    setTimeout(() => { t.scrollIntoView({behavior: reduce ? 'auto' : 'smooth'}); history.replaceState(null, '', href); }, 0);
  }
}));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && hdr.classList.contains('open')) { setMenu(false); burger.focus(); } });
matchMedia('(min-width:901px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

// sticky "discuss" button on phones: after the hero, hidden near the contact block and while menu/case is open
const mcta = document.querySelector('.mcta'), heroEl = document.querySelector('.hero .actions'), contactEl = document.getElementById('contact');
function toggleMcta(){
  const on = heroEl.getBoundingClientRect().bottom < 0 && contactEl.getBoundingClientRect().top > innerHeight - 40
    && !document.body.classList.contains('cm-lock') && !document.body.classList.contains('menu-lock');
  mcta.classList.toggle('show', on);
}
addEventListener('scroll', toggleMcta, {passive:true}); addEventListener('resize', toggleMcta);
new MutationObserver(toggleMcta).observe(document.body, {attributes:true, attributeFilter:['class']}); toggleMcta();

// highlight current section in menu
const menuLinks = [...document.querySelectorAll('.menu a')];
const secs = ['services','problems','method','cases','formats','tech','faq','contact'].map(id => document.getElementById(id));
function markMenu(){
  const y = innerHeight * .4; let cur = null;
  secs.forEach(sec => { if (sec.getBoundingClientRect().top <= y) cur = sec.id; });
  menuLinks.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + cur));
}
addEventListener('scroll', markMenu, {passive:true}); markMenu();

// reveal on scroll
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), {threshold:.12});
document.querySelectorAll('.rv').forEach(el => io.observe(el));

// hero: typed task + agent steps
const tasks = [
  {t:'Собери утреннюю сводку по продажам', r:['Сводка отправлена в Telegram','Показатели, сравнение с планом и выводы']},
  {t:'Разбери новые заявки в Трекере', r:['Заявки разобраны','Две спорные переданы человеку']},
  {t:'Проверь документы поставщиков', r:['Документы проверены','Один вопрос бухгалтеру']},
];
const typed = document.getElementById('typed'), steps = [...document.querySelectorAll('#steps li')];
const mark = document.getElementById('agentMark');
const result = document.getElementById('result'), rT = document.getElementById('resTitle'), rS = document.getElementById('resSub');
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function heroLoop(){
  if (reduce) {
    typed.textContent = tasks[0].t; steps.forEach(s => s.className = 'done');
    rT.textContent = tasks[0].r[0]; rS.textContent = tasks[0].r[1]; result.classList.add('show'); mark.classList.remove('logo-live');
    return;
  }
  const stageEl = watch(document.querySelector('.stage'));
  for (let k = 0; ; k = (k + 1) % tasks.length) {
    await whenVisible(stageEl);
    const {t, r} = tasks[k];
    steps.forEach(s => s.className = ''); result.classList.remove('show');
    rT.textContent = 'Готовый результат'; rS.textContent = 'Отчёт, выполненная задача, решение в пределах лимита';
    typed.textContent = '';
    for (const ch of t) { typed.textContent += ch; await sleep(reduce ? 0 : 38); }
    await sleep(500);
    mark.classList.add('logo-live');
    for (const s of steps) { s.className = 'on'; await sleep(1100); s.className = 'done'; }
    mark.classList.remove('logo-live');
    rT.textContent = r[0]; rS.textContent = r[1]; result.classList.add('show');
    await sleep(3200);
  }
}
heroLoop();

// orbit chips: place on the arc of a big circle whose centre sits right of the panel
function layoutOrbit(){
  const o = document.getElementById('orbit'), b = o.getBoundingClientRect(), svg = document.getElementById('orbitsvg');
  const R = b.width < 600 ? b.height * .62 : Math.max(b.height * .62, 220), cx = b.width * .72 + R, cy = b.height / 2;
  svg.setAttribute('viewBox', `0 0 ${b.width} ${b.height}`);
  svg.innerHTML = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="rgba(255,255,255,.45)"/>`;
  o.querySelectorAll('.chip').forEach(c => {
    const a = (180 - c.dataset.a) * Math.PI / 180;
    c.style.left = (cx + R * Math.cos(a)) + 'px'; c.style.top = (cy + R * Math.sin(a)) + 'px';
  });
}
layoutOrbit(); addEventListener('resize', layoutOrbit);
const chips = [...document.querySelectorAll('#orbit .chip')]; let ci = 0;
chips[0].classList.add('on');
const orbitEl = watch(document.getElementById('orbit'));
if (!reduce) setInterval(() => { if (!inView.get(orbitEl)) return; chips[ci].classList.remove('on'); ci = (ci + 1) % chips.length; chips[ci].classList.add('on'); }, 1800);

// ladder + steps
const ms = [...document.querySelectorAll('#msteps .mstep')]; let li = 0;
function setStep(i){
  li = i;
  ms.forEach((m, j) => m.classList.toggle('on', j === i));
  document.querySelectorAll('#ladder [data-i]').forEach(n => n.classList.toggle('on', +n.dataset.i === i));
}
setStep(0);
const ladderEl = watch(document.querySelector('.method'));
let auto = reduce ? null : setInterval(() => { if (inView.get(ladderEl)) setStep((li + 1) % 3); }, 2600);
ms.forEach((m, i) => m.addEventListener('mouseenter', () => { clearInterval(auto); setStep(i); }));

// tech network lines
function drawNet(){
  const net = document.getElementById('net'), svg = document.getElementById('netsvg');
  const b = net.getBoundingClientRect(), cx = b.width / 2, cy = b.height / 2;
  svg.setAttribute('viewBox', `0 0 ${b.width} ${b.height}`);
  svg.innerHTML = [...net.querySelectorAll('.node')].map(n => {
    const x = parseFloat(n.style.left) / 100 * b.width, y = parseFloat(n.style.top) / 100 * b.height;
    return `<path d="M${cx},${cy} Q${(cx + x) / 2 + (y - cy) * .15},${(cy + y) / 2 - (x - cx) * .15} ${x},${y}" fill="none" stroke="rgba(255,255,255,.18)" stroke-dasharray="2 5"/>`;
  }).join('');
}
drawNet(); addEventListener('resize', drawNet);
watch(document.getElementById('net')); watch(document.querySelector('.cta'));

// belt: duplicate for seamless loop
const belt = document.getElementById('belt'); belt.innerHTML += belt.innerHTML;

// ===== ported cases logic =====
const setLocalHash=hash=>{try{history.replaceState(null,'',hash)}catch{location.hash=hash}};
(()=>{const tabs=[...document.querySelectorAll('.tab')],slides=[...document.querySelectorAll('.slide')],pos=document.getElementById('pos'),tl=document.getElementById('tabs');let cur=0;
const narrow=()=>matchMedia('(max-width:860px)').matches;
const sel=(i,scroll)=>{cur=(i+tabs.length)%tabs.length;tabs.forEach((t,k)=>{t.classList.toggle('on',k===cur);t.setAttribute('aria-selected',String(k===cur))});slides.forEach((x,k)=>x.hidden=k!==cur);pos.textContent=String(cur+1).padStart(2,'0');
 if(narrow()){tl.scrollLeft=tabs[cur].offsetLeft-tl.offsetLeft-20;if(scroll){const r=slides[cur].getBoundingClientRect();if(r.top<70||r.top>innerHeight*.6)window.scrollTo({top:scrollY+r.top-140,behavior:'smooth'})}}};
tabs.forEach((t,k)=>t.addEventListener('click',()=>sel(k,true)));document.querySelectorAll('[data-d]').forEach(b=>b.addEventListener('click',()=>sel(cur+Number(b.dataset.d),false)));
let x0=null;const sl=document.getElementById('slides');sl.addEventListener('touchstart',e=>x0=e.touches[0].clientX,{passive:true});sl.addEventListener('touchend',e=>{if(x0===null)return;const dx=e.changedTouches[0].clientX-x0;if(Math.abs(dx)>60)sel(cur+(dx<0?1:-1),false);x0=null},{passive:true});})();
(()=>{
 const m=document.getElementById('caseModal'),body=m.querySelector('.cm__body'),win=m.querySelector('.cm__win');
 const ids=[...new Set([...document.querySelectorAll('#slides .case-open')].map(b=>b.dataset.case))];let cur=null,last=null;
 let io=null;const play=()=>{if(io)io.disconnect();const vs=[...m.querySelectorAll('video')];vs.forEach(v=>{v.muted=true;v.pause();if(v.closest('.phone'))v.closest('.phone').classList.add('paused')});if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;io=new IntersectionObserver(es=>es.forEach(x=>{const v=x.target,ph=v.closest('.phone');if(x.isIntersecting){v.play().then(()=>ph&&ph.classList.remove('paused')).catch(()=>{})}else{v.pause();ph&&ph.classList.add('paused')}}),{root:null,threshold:.5});vs.forEach(v=>io.observe(v))};
 const bindPhones=()=>m.querySelectorAll('.phone').forEach(p=>{const tog=()=>{const v=p.querySelector('video');if(v.paused){v.play().catch(()=>{});p.classList.remove('paused')}else{v.pause();p.classList.add('paused')}};p.addEventListener('click',tog);p.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();tog()}})});
 const render=id=>{const t=document.getElementById('case-'+id);if(!t)return;body.innerHTML='';[...t.children].forEach(n=>body.appendChild(n.cloneNode(true)));win.setAttribute('aria-labelledby','cmTitle-case-'+id);body.querySelectorAll('video').forEach(v=>v.preload='metadata');cur=id;bindPhones();if(matchMedia('(max-width:900px)').matches){const v=body.querySelector('.cm__vis'),r=body.querySelector('.cm__res');if(v&&r)r.after(v);if(matchMedia('(max-width:720px)').matches){const title=body.querySelector('.cm__title');if(title&&r)title.after(r);if(r&&v)r.after(v)}}play();const i=m.querySelector('.cm__info');if(i)i.scrollTop=0;win.scrollTop=0;setLocalHash('#case-'+id)};
 let closeT=null;const open=id=>{clearTimeout(closeT);last=document.activeElement;render(id);m.hidden=false;m.setAttribute('aria-hidden','false');document.body.classList.add('cm-lock');void m.offsetWidth;m.classList.add('is-open');const closeButton=m.querySelector('.cm__x');if(matchMedia('(max-width:720px)').matches){closeButton.focus({preventScroll:true});win.scrollTop=0}else closeButton.focus()};
 const close=()=>{m.classList.remove('is-open');document.body.classList.remove('cm-lock');m.querySelectorAll('video').forEach(v=>v.pause());if(io)io.disconnect();closeT=setTimeout(()=>{m.hidden=true;m.setAttribute('aria-hidden','true');body.innerHTML=''},300);setLocalHash('#cases');if(last)last.focus()};
 const step=d=>{const i=ids.indexOf(cur);render(ids[(i+d+ids.length)%ids.length])};
 document.querySelectorAll('.case-open').forEach(b=>b.addEventListener('click',()=>open(b.dataset.case)));
 const bar=document.createElement('div');bar.className='cm__bar';win.prepend(bar);bar.append(m.querySelector('.cm__nav'),m.querySelector('.cm__x'));
 let y0=null;win.addEventListener('touchstart',e=>{y0=(e.target.closest('.cm__bar')||win.scrollTop<=0)?e.touches[0].clientY:null},{passive:true});
 win.addEventListener('touchend',e=>{if(y0===null)return;const dy=e.changedTouches[0].clientY-y0;if(dy>90)close();y0=null},{passive:true});
 const phone=()=>matchMedia('(max-width:720px)').matches;
 document.querySelectorAll('.slide').forEach(sl=>{const b=sl.querySelector('.case-open');if(b)sl.addEventListener('click',e=>{if(phone()&&!e.target.closest('.case-open'))open(b.dataset.case)})});
 m.addEventListener('click',e=>{if(e.target.closest('[data-close]'))close();const s=e.target.closest('[data-step]');if(s)step(+s.dataset.step)});
 document.addEventListener('keydown',e=>{if(m.hidden)return;if(e.key==='Escape')close();if(e.key==='ArrowRight')step(1);if(e.key==='ArrowLeft')step(-1)});
 const h=location.hash.match(/^#case-(.+)$/);if(h&&ids.includes(h[1]))open(h[1]);
})();
(()=>{const b=document.querySelector('.mobile-all'),more=document.getElementById('mobile-more');b.addEventListener('click',()=>{const open=b.getAttribute('aria-expanded')!=='true';b.setAttribute('aria-expanded',String(open));more.hidden=!open;b.firstElementChild.textContent=open?'Свернуть кейсы':'Все кейсы';b.lastElementChild.textContent=open?'3 из 11 ↑':'11 кейсов ↗';if(open)more.querySelector('button').focus();else document.querySelector('.mobile-cases').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'})});})();
