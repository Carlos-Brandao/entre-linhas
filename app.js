(() => {
'use strict';
const topics=window.EL_TOPICS;
const main=document.getElementById('main');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=i=>String(i+1).padStart(2,'0');
const ALIASES={'regressao-simples':'regressao-linear','regressao-multipla':'regressao-linear'};
const path=()=>{const id=location.hash.slice(1).split('/')[0]||'inicio';return ALIASES[id]||id;};
function graphic(type){
  const head='<svg viewBox="0 0 80 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">';
  const line='stroke="currentColor" stroke-width="1.7"';
  if(type==='graph')return head+`<path d="M12 28L38 10 66 25 38 39 12 28M38 10V39" ${line}/><g fill="currentColor"><circle cx="12" cy="28" r="4"/><circle cx="38" cy="10" r="4"/><circle cx="66" cy="25" r="4"/><circle cx="38" cy="39" r="4"/></g></svg>`;
  if(type==='line'||type==='curve'||type==='gradient')return head+`<path d="M10 5V40H73" stroke="#455154"/><path d="${type==='line'?'M15 34L65 10':type==='gradient'?'M16 8Q45 66 69 10':'M12 34Q35 36 44 20T70 8'}" ${line}/><g fill="#5ea7ff"><circle cx="24" cy="31" r="2"/><circle cx="38" cy="23" r="2"/><circle cx="52" cy="16" r="2"/></g></svg>`;
  if(type==='multi')return head+`<path d="M18 10L50 24M18 24H50M18 38L50 24M56 24H72M67 19L72 24 67 29" ${line}/><g fill="#5ea7ff"><circle cx="14" cy="10" r="4"/><circle cx="14" cy="24" r="4"/><circle cx="14" cy="38" r="4"/></g><circle cx="53" cy="24" r="5" fill="currentColor"/></svg>`;
  if(type==='matrix')return head+`<path d="M12 40V16H34V40Z" stroke="#5ea7ff" stroke-dasharray="3 3"/><path d="M46 40L56 16H78L68 40Z" ${line}/><path d="M36 28H46M42 24L46 28 42 32" ${line}/><g fill="currentColor"><circle cx="46" cy="40" r="2.5"/><circle cx="56" cy="16" r="2.5"/><circle cx="78" cy="16" r="2.5"/><circle cx="68" cy="40" r="2.5"/></g></svg>`;
  if(type==='rotate')return head+`<path d="M14 40V18H36V40Z" stroke="#5ea7ff" stroke-dasharray="3 3"/><path d="M58 8L73 24 58 40 43 24Z" ${line}/><path d="M28 12Q40 2 52 8M47 6L52 8 50 13" ${line}/><circle cx="58" cy="24" r="2.5" fill="currentColor"/></svg>`;
  if(type==='vector')return head+`<path d="M15 4V40H72" stroke="#455154"/><path d="M15 40L61 12M49 13L61 12 60 24" ${line}/><path d="M15 40L35 8 60 34Z" stroke="#5ea7ff" stroke-dasharray="3 3"/></svg>`;
  if(type==='system')return head+`<path d="M10 5V40H73" stroke="#455154"/><path d="M14 36L70 10" ${line}/><path d="M14 12L70 38" stroke="#5ea7ff" stroke-width="1.7"/><circle cx="42" cy="23" r="4" fill="currentColor"/></svg>`;
  if(type==='angle')return head+`<path d="M14 40H72" ${line}/><path d="M14 40L52 8" stroke="#5ea7ff" stroke-width="1.7"/><path d="M34 40A20 20 0 0 0 29 27" ${line}/><path d="M64 40V30H72" stroke="#455154"/></svg>`;
  if(type==='eigen')return head+`<path d="M40 24L72 6" ${line}/><path d="M40 24L56 15" stroke="#5ea7ff" stroke-width="3"/><path d="M40 24L20 40" stroke="#455154" stroke-dasharray="3 3"/><path d="M40 24L58 42" stroke="#455154" stroke-dasharray="3 3"/><circle cx="40" cy="24" r="3" fill="currentColor"/></svg>`;
  return head+`<path d="M16 5H9V42H16M63 5H70V42H63" ${line}/><g fill="currentColor"><rect x="22" y="11" width="8" height="8" rx="1"/><rect x="37" y="11" width="8" height="8" rx="1"/><rect x="52" y="11" width="8" height="8" rx="1"/><rect x="22" y="28" width="8" height="8" rx="1"/><rect x="37" y="28" width="8" height="8" rx="1"/><rect x="52" y="28" width="8" height="8" rx="1"/></g></svg>`;
}
const UNITS=[{id:'I',name:'Unidade I',title:'Álgebra matricial, determinante e sistemas lineares'},{id:'II',name:'Unidade II',title:'Vetores em Rⁿ e transformações'},{id:'III',name:'Unidade III',title:'Autovalores, autovetores e espaços vetoriais'},{id:'extra',name:'Extras',title:'Para quem quer ir além da ementa'}];
const main9=topics.filter(t=>t.unit!=='extra');
const label=t=>t.unit==='extra'?'+':num(main9.indexOf(t));
const plural=(n,one,many)=>`${n} ${n===1?one:many}`;
const card=t=>`<a class="topic-card" href="#${t.id}"><div class="card-number">${label(t)}${graphic(t.symbol)}</div><h3>${t.title}</h3><p>${t.description}</p><span class="tag">${t.unit==='extra'?t.ementa:'Ementa '+t.ementa}</span></a>`;
const topicCards=()=>UNITS.map(u=>`<div class="unit-block"><div class="unit-head"><span class="eyebrow">${u.name}</span><h3>${u.title}</h3></div><div class="topic-grid">${topics.filter(t=>t.unit===u.id).map(card).join('')}</div></div>`).join('');
function navigation(){document.getElementById('navigation').innerHTML=`<p class="nav-section">Entre Linhas</p><a class="nav-link" href="#inicio">Visão geral</a><a class="nav-link" href="#sobre">Quem somos</a><p class="nav-section">Da teoria à prática</p><a class="nav-link" href="experiencia/">Experiência interativa</a><a class="nav-link" href="#areas">Áreas e casos de uso</a>${window.EL_TOPICS.some(t=>window.EL_PAGES.recordingUrl(t.id))?'<a class="nav-link" href="#aulas">Aulas gravadas</a>':''}<a class="nav-link" href="#diagnostico">Quiz diagnóstico</a>${UNITS.map(u=>`<p class="nav-section">${u.name}</p>${topics.filter(t=>t.unit===u.id).map(t=>`<a class="nav-link" href="#${t.id}"><span class="num">${label(t)}</span><span>${t.title}</span></a>`).join('')}`).join('')}`;}
// Faixa "Da teoria à prática": os mesmos links em uma linha que desliza em loop.
// A lista vai duas vezes para o loop emendar sem salto; a cópia fica fora da leitura de tela e do teclado.
function faixaPratica(){
  const itens=[...window.EL_PAGES.areas.map(a=>[`#areas/${a.id}`,a.name]),['#areas/casos-reais','Casos reais']];
  const grupo=copia=>`<div class="faixa-grupo area-links practice-links"${copia?' aria-hidden="true"':''}>${itens.map(([href,nome])=>`<a href="${href}"${copia?' tabindex="-1"':''}>${nome}</a>`).join('')}</div>`;
  return `<div class="faixa" id="faixa-pratica"><div class="faixa-trilho">${grupo(false)}${grupo(true)}</div></div>`;
}
function overview(){return `<div class="intro"><div class="hero-top"><img class="home-mark" src="assets/marca-animada.svg" alt="Entre Linhas" width="200" height="150"><span class="eyebrow">Para alunos de Computação · Álgebra UNIFOR</span><h1>A teoria faz sentido<br>quando você <em>vê acontecer.</em></h1></div><p class="lead">Veja onde a Álgebra Linear da cadeira aparece na Computação. Mexa nos valores e observe o resultado.</p><div class="stats"><span><strong>03</strong>unidades da ementa</span><span><strong>${num(main9.length-1)}</strong>conteúdos</span><span><strong>${topics.reduce((n,t)=>n+t.demos.length,0)}</strong>demonstrações</span></div><div class="actions"><a class="button primary" href="experiencia/">Viver a experiência</a><a class="button secondary" href="#diagnostico">Faça o termômetro</a><a class="button secondary" href="#areas">Ver onde a álgebra aparece</a></div></div><section aria-labelledby="practice-title"><div class="section-head"><h2 id="practice-title">Da teoria à prática</h2><span>Comece pelo que você quer construir</span></div>${faixaPratica()}</section><section class="section" aria-labelledby="topics-title"><div class="section-head"><h2 id="topics-title">Na ordem da cadeira</h2><span>A ementa de Álgebra Linear da UNIFOR</span></div>${topicCards()}</section>`;}
let activeRoute = null;
function scrollSection(){const part=location.hash.slice(1).split('/')[1];if(part){requestAnimationFrame(()=>document.getElementById(part)?.scrollIntoView({block:'start'}));}else window.scrollTo(0,0);}
function render(){
 const id=path(); const page=window.EL_PAGES.render(id);
 main.innerHTML=page?page.html:overview();
 document.querySelectorAll('.nav-link').forEach(a=>a.setAttribute('aria-current',a.hash===`#${id}`?'page':'false'));
 document.getElementById('breadcrumb').textContent=page?`Documentação / ${page.title}`:'Documentação / Álgebra UNIFOR';
 document.title=`${page?.title||'Álgebra na prática'} | Entre Linhas`;
 document.getElementById('sidebar').classList.remove('open');document.getElementById('menu-toggle').setAttribute('aria-expanded','false');
 window.EL_PAGES.mount(id);activeRoute=id;
}
window.EL_DOCS={topics,esc,graphic,topicCards,overview,render,main9,UNITS};
navigation();render();scrollSection();
window.addEventListener('hashchange',()=>{if(path()!==activeRoute){render();main.focus({preventScroll:true});}scrollSection();});
document.getElementById('menu-toggle').addEventListener('click',()=>{const open=document.getElementById('sidebar').classList.toggle('open');document.getElementById('menu-toggle').setAttribute('aria-expanded',String(open));});
// No toque não existe "passar o mouse": a faixa pausa ao encostar e retoma um pouco depois de soltar.
let retomarFaixa=0;
document.addEventListener('pointerdown',e=>{const f=e.target.closest?.('.faixa');if(!f||e.pointerType==='mouse')return;clearTimeout(retomarFaixa);f.classList.add('pausada');});
['pointerup','pointercancel'].forEach(tipo=>document.addEventListener(tipo,e=>{if(e.pointerType==='mouse')return;clearTimeout(retomarFaixa);retomarFaixa=setTimeout(()=>document.querySelectorAll('.faixa.pausada').forEach(f=>f.classList.remove('pausada')),2500);}));
document.querySelector('.skip-link').addEventListener('click',event=>{event.preventDefault();main.focus();main.scrollIntoView();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const sidebar=document.getElementById('sidebar');if(sidebar.classList.contains('open'))document.getElementById('menu-toggle').focus();sidebar.classList.remove('open');document.getElementById('menu-toggle').setAttribute('aria-expanded','false');}});
window.EL_DOCS={topics,esc,graphic,topicCards,overview,render,main9,UNITS};
})();
