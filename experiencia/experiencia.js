// Experiência Entre Linhas: linha do tempo horizontal em 9 estações, dirigida pela rolagem.
// A rolagem vertical nativa vira o progresso p (0 a 1). O texto é HTML; o Three.js só enriquece.
// Especificação: ../../EXPERIENCIA-SPEC.md

const N = 9;            // número de estações
const PASSO = 14;       // distância entre estações no eixo X
const FIM_LINHAS = 7 * PASSO + 0.825; // as duas linhas terminam dentro do [=] da estação 7

const COR = {
  fundo: 0x0b0c0d, borda: 0x2a2d30, texto: 0xf4f5f2, aux: 0xa8adb3,
  ciano: 0x63e6d5, azul: 0x5ea7ff, violeta: 0x9d7dff,
};

const movimentoReduzido = matchMedia('(prefers-reduced-motion: reduce)');
const desktop = matchMedia('(min-width: 900px)');
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const limitar = (v, a, b) => Math.min(b, Math.max(a, v));
const suave = t => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const fmt = (v, casas = 2) => (Math.abs(v) < 0.005 ? 0 : v).toFixed(casas).replace('-', '−').replace('.', ',');

/* =====================================================================
   Lógica das estações (funciona com ou sem WebGL)
   ===================================================================== */

// ---------- Passos internos: cada estação pode ser "aberta" pela rolagem ----------
// Passo 0 = visão de fora. Nos seguintes a câmera aproxima (zoom < 1) e o texto aprofunda.
// zoom multiplica o raio da estação; camX e camY deslocam o foco da câmera.
const PASSOS = {
  1: [
    { zoom: 1 },
    { eyebrow: 'Dentro do problema · 1 de 3', titulo: 'Na cadeira, com profundidade.',
      corpo: 'Vetores, matrizes e transformações: definição, propriedade e conta. A teoria está bem servida.', zoom: 0.67, camY: 1.2 },
    { eyebrow: 'Dentro do problema · 2 de 3', titulo: 'Na prática, todo dia.',
      corpo: 'Um personagem que anda, uma foto no celular, uma cena 3D que gira. Tudo isso roda em cima da mesma matemática.', zoom: 0.86 },
    { eyebrow: 'Dentro do problema · 3 de 3', titulo: 'O que falta é a ponte.',
      corpo: 'Quase ninguém mostra que o vetor é o movimento, a matriz é a imagem e a transformação é o giro. O Entre Linhas constrói essas pontes.', zoom: 0.86 },
  ],
  2: [
    { zoom: 1 },
    { eyebrow: 'Entrega 1 de 4', titulo: 'Documentação na ordem da cadeira.',
      corpo: 'Nove conteúdos seguindo as três unidades da ementa. Cada um com conceito, código em Python e referências.', zoom: 0.6, camX: -2.25 },
    { eyebrow: 'Entrega 2 de 4', titulo: '33 demonstrações para mexer.',
      corpo: 'Você altera os valores e vê o resultado na hora, em problemas de jogos, imagens, sensores e redes.', zoom: 0.6, camX: -0.75 },
    { eyebrow: 'Entrega 3 de 4', titulo: 'Quizzes e termômetro.',
      corpo: 'Um termômetro antes da aula e questões por conteúdo, para conferir o que ficou.', zoom: 0.6, camX: 0.75 },
    { eyebrow: 'Entrega 4 de 4', titulo: 'Aula presencial e aulas gravadas.',
      corpo: 'Cerca de 40 minutos em sala. Depois, o material continua aberto no site e no canal do YouTube.', zoom: 0.6, camX: 2.25 },
  ],
  4: [
    { zoom: 1 },
    { eyebrow: 'Unidade I · a ideia', titulo: 'Notas conhecidas preenchem as que faltam.',
      corpo: 'Cada linha é uma pessoa, cada coluna um filme. A conta completa os buracos, em violeta. Mude uma nota sua.', zoom: 1 },
    { eyebrow: 'Unidade I · na cadeira', titulo: 'Isso é matriz e mínimos quadrados.',
      corpo: 'A tabela é uma matriz. Completar os buracos com o menor erro é o método dos mínimos quadrados, o mesmo da regressão (ementa 01.01 e 01.08).', zoom: 1 },
  ],
  5: [
    { zoom: 1 },
    { eyebrow: 'Unidade II · a ideia', titulo: 'Setas que apontam para o mesmo lado combinam.',
      corpo: 'Cada conta é uma seta, e a direção resume o assunto. As mais alinhadas com a sua aparecem no Explorar. Mude seu gosto.', zoom: 1 },
    { eyebrow: 'Unidade II · na cadeira', titulo: 'Isso é produto escalar e ângulo entre vetores.',
      corpo: 'O cosseno do ângulo mede o alinhamento: perto de 1, recomenda. O tamanho da seta não importa, só a direção (ementa 02.02 e 02.03).', zoom: 1 },
  ],
  6: [
    { zoom: 1 },
    { eyebrow: 'Unidade III · a ideia', titulo: 'Um link é um voto. Voto de página importante vale mais.',
      corpo: 'A importância circula pelos links até parar de mudar. Toque em uma página para dar um link a ela.', zoom: 1 },
    { eyebrow: 'Unidade III · na cadeira', titulo: 'Esse equilíbrio é um autovetor.',
      corpo: 'Repetir a mesma multiplicação até os números estabilizarem leva ao autovetor de autovalor 1 (ementa 03.03).', zoom: 1 },
  ],
};
const passoAtual = new Array(N).fill(0);
const partesPasso = {}; // por estação: elementos de texto que mudam a cada passo

function prepararPassos() {
  Object.keys(PASSOS).forEach(k => {
    const i = +k, sec = $$('.estacao')[i], texto = $('.texto', sec);
    const eyebrow = $('.eyebrow', sec), titulo = $('h2', sec);
    let corpo = $('p:not(.eyebrow):not(.selo)', texto);
    if (!corpo) { // estação sem parágrafo próprio (lista de entregas): o corpo só aparece nos passos
      corpo = document.createElement('p');
      corpo.className = 'so-passo';
      titulo.after(corpo);
      $$('.entregas, .selo', texto).forEach(el => el.classList.add('so-visao'));
    }
    let ctrl = $('.controles', sec);
    if (!ctrl) { ctrl = document.createElement('div'); ctrl.className = 'controles'; sec.appendChild(ctrl); }
    let dica = $('.dica', ctrl);
    if (!dica) { dica = document.createElement('p'); dica.className = 'dica'; ctrl.appendChild(dica); }
    dica.classList.add('dica-passo');
    if (i >= 4) sec.classList.add('unidade'); // controles só no último passo
    // o passo 0 guarda o texto original da página
    Object.assign(PASSOS[i][0], { eyebrow: eyebrow.textContent, titulo: titulo.textContent, corpo: corpo.textContent });
    partesPasso[i] = { sec, eyebrow, titulo, corpo, dica };
    aplicarPasso(i);
  });
}

function aplicarPasso(i) {
  const lista = PASSOS[i], passo = passoAtual[i], m = lista[passo], el = partesPasso[i];
  const ultimo = passo === lista.length - 1;
  el.eyebrow.textContent = m.eyebrow;
  el.titulo.textContent = m.titulo;
  el.corpo.textContent = m.corpo;
  el.dica.textContent = passo === 0 ? 'role para entrar →' : ultimo ? 'role para seguir →' : 'continue rolando →';
  el.sec.dataset.fase = passo === 0 ? 'visao' : ultimo ? 'fim' : 'dentro';
}

function mudarPasso(i, passo) {
  if (!PASSOS[i] || !partesPasso[i]) return;
  passo = limitar(passo, 0, PASSOS[i].length - 1);
  if (passo === passoAtual[i]) return;
  passoAtual[i] = passo;
  aplicarPasso(i);
  if (cena3d) cena3d.medir();
  pedirQuadro();
}

// ---------- Estação 4: a matriz de notas (ideia base das recomendações da Netflix) ----------
// 0 = a pessoa ainda não viu o filme. Dados fictícios.
const PESSOAS = ['Você', 'Ana', 'Bia', 'Caio'];
const FILMES = ['Heróis', 'Corrida', 'Humor', 'Amor', 'Terror'];
const NOTAS_INICIAIS = [[5, 0, 2, 0, 1], [5, 5, 1, 2, 0], [1, 2, 5, 5, 0], [4, 0, 2, 1, 5]];
const notas = { R: NOTAS_INICIAIS.map(l => l.slice()), previsto: [], exibido: [] };

// Fatoração de matrizes por mínimos quadrados alternados (posto 2, com regularização):
// procura U e V tais que nota ≈ média + U[pessoa] · V[filme] nas notas conhecidas.
function completarMatriz(R, lambda = 0.35, voltas = 40) {
  const n = R.length, m = R[0].length;
  let soma = 0, cont = 0;
  R.forEach(l => l.forEach(v => { if (v) { soma += v; cont++; } }));
  const media = soma / cont;
  let U = Array.from({ length: n }, (_, i) => [0, 1].map(k => 0.6 * Math.cos(1.3 * i + 2.1 * k + 0.4)));
  let V = Array.from({ length: m }, (_, j) => [0, 1].map(k => 0.6 * Math.sin(0.9 * j + 1.7 * k + 0.2)));
  // resolve (AᵀA + λI) x = Aᵀb
  const resolver = (linhas, alvos) => {
    let a = lambda, b = 0, d = lambda, p = 0, q = 0;
    linhas.forEach((x, t) => { a += x[0] * x[0]; b += x[0] * x[1]; d += x[1] * x[1]; p += x[0] * alvos[t]; q += x[1] * alvos[t]; });
    const det = a * d - b * b;
    return [(d * p - b * q) / det, (a * q - b * p) / det];
  };
  for (let v = 0; v < voltas; v++) {
    U = U.map((_, i) => { const js = R[i].map((x, j) => (x ? j : -1)).filter(j => j >= 0); return resolver(js.map(j => V[j]), js.map(j => R[i][j] - media)); });
    V = V.map((_, j) => { const is = R.map((l, i) => (l[j] ? i : -1)).filter(i => i >= 0); return resolver(is.map(i => U[i]), is.map(i => R[i][j] - media)); });
  }
  return R.map((l, i) => l.map((_, j) => limitar(media + U[i][0] * V[j][0] + U[i][1] * V[j][1], 1, 5)));
}

function atualizarNotas() {
  notas.previsto = completarMatriz(notas.R);
  if (!notas.exibido.length || movimentoReduzido.matches) notas.exibido = notas.previsto.map(l => l.slice());
  const voce = notas.R[0];
  $('#notas').innerHTML = voce.map((v, j) => v ? `<div class="nota"><button type="button" data-filme="${j}" data-d="-1" aria-label="Baixar sua nota de ${FILMES[j]}" ${v <= 1 ? 'disabled' : ''}>−</button><span>${FILMES[j]}<b>${v}</b></span><button type="button" data-filme="${j}" data-d="1" aria-label="Subir sua nota de ${FILMES[j]}" ${v >= 5 ? 'disabled' : ''}>+</button></div>` : '').join('');
  const faltam = voce.map((v, j) => (v ? null : j)).filter(j => j !== null).sort((a, b) => notas.previsto[0][b] - notas.previsto[0][a]);
  $('#leitura-notas').innerHTML = 'Você não viu: ' + faltam.map(j => `${FILMES[j]} <span class="previsto">${fmt(notas.previsto[0][j], 1)}</span>`).join(' · ') +
    ` <span class="ok">→ sugere ${FILMES[faltam[0]]}</span>`;
  pedirQuadro();
}

// ---------- Estação 5: contas como vetores (ideia base do Explorar do Instagram) ----------
// Eixo x = esporte, eixo y = humor. ang = direção da conta; tam = tamanho da seta (não muda o cosseno). Dados fictícios.
const CONTAS = [
  { nome: '@futebol', ang: 6, tam: 2.3 }, { nome: '@treino', ang: 24, tam: 1.5 }, { nome: '@golsbizarros', ang: 46, tam: 2.0 },
  { nome: '@standup', ang: 68, tam: 1.4 }, { nome: '@memes', ang: 86, tam: 2.2 },
];
const explorar = { alvo: 25, atual: 25, ordem: [] };

function atualizarExplorar() {
  explorar.alvo = +$('#gosto').value;
  if (movimentoReduzido.matches) explorar.atual = explorar.alvo;
  const cos = CONTAS.map(c => Math.cos((c.ang - explorar.alvo) * Math.PI / 180));
  explorar.ordem = CONTAS.map((_, k) => k).sort((a, b) => cos[b] - cos[a]);
  $('#gosto-v').textContent = explorar.alvo < 30 ? 'esporte' : explorar.alvo > 60 ? 'humor' : 'os dois';
  $('#leitura-explorar').innerHTML = 'No seu Explorar: ' + explorar.ordem.slice(0, 2).map(k => `<span class="ok">${CONTAS[k].nome}</span> cos ${fmt(cos[k])}`).join(' · ') +
    `<br>Fica de fora: ${CONTAS[explorar.ordem[4]].nome} cos ${fmt(cos[explorar.ordem[4]])}`;
  pedirQuadro();
}

// ---------- Estação 6: PageRank por iteração de potência ----------
const PAGINAS = ['A', 'B', 'C', 'D', 'E'];
const LINKS_INICIAIS = [[0, 1], [0, 2], [1, 2], [2, 0], [3, 2], [3, 0], [4, 3]]; // [origem, destino]
const AMORTECIMENTO = 0.85;
const rank = { links: [], r: [], exibido: [], iteracao: 0, estavel: false, ultimoPasso: 0, novo: -1, mensagem: '' };

function saidas(links) {
  const out = PAGINAS.map(() => []);
  links.forEach(([de, para]) => out[de].push(para));
  return out;
}

// Um passo de r ← (1 − d)/n + d · Σ r_j / saída_j. Páginas sem saída repartem com todas.
function passoPotencia(r, links) {
  const n = PAGINAS.length, out = saidas(links);
  const nr = new Array(n).fill((1 - AMORTECIMENTO) / n);
  out.forEach((dest, j) => {
    if (!dest.length) { for (let k = 0; k < n; k++) nr[k] += AMORTECIMENTO * r[j] / n; }
    else dest.forEach(k => { nr[k] += AMORTECIMENTO * r[j] / dest.length; });
  });
  return nr;
}

function pagerankConvergido(links) {
  let r = new Array(PAGINAS.length).fill(1 / PAGINAS.length);
  for (let i = 0; i < 500; i++) {
    const nr = passoPotencia(r, links);
    const dif = nr.reduce((s, v, k) => s + Math.abs(v - r[k]), 0);
    r = nr;
    if (dif < 1e-12) break;
  }
  return r;
}

// Arredonda para inteiros que somam exatamente 100 (maiores restos).
function percentuais(r) {
  const total = r.reduce((a, b) => a + b, 0);
  const brutos = r.map(v => v / total * 100);
  const base = brutos.map(Math.floor);
  let falta = 100 - base.reduce((a, b) => a + b, 0);
  brutos.map((v, i) => [v - base[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (falta > 0) { base[i]++; falta--; } });
  return base;
}

function reiniciarRank() {
  rank.links = LINKS_INICIAIS.map(l => l.slice());
  rank.r = pagerankConvergido(rank.links);
  rank.exibido = new Array(PAGINAS.length).fill(1 / PAGINAS.length);
  rank.iteracao = 0;
  rank.estavel = false;
  rank.novo = -1;
  rank.mensagem = '';
  if (movimentoReduzido.matches || (iniciado && !cena3d)) convergirRank();
  atualizarLeituraRank();
  if (cena3d) cena3d.estacao6.reconstruirArestas();
  pedirQuadro();
}

function convergirRank() {
  let r = rank.exibido, i = rank.iteracao;
  for (; i < rank.iteracao + 500; i++) {
    const nr = passoPotencia(r, rank.links);
    const dif = nr.reduce((s, v, k) => s + Math.abs(v - r[k]), 0);
    r = nr;
    if (dif < 1e-9) { i++; break; }
  }
  rank.exibido = r; rank.iteracao = i; rank.estavel = true;
}

function passoRank(agora) {
  if (rank.estavel || agora - rank.ultimoPasso < 260) return false;
  rank.ultimoPasso = agora;
  const nr = passoPotencia(rank.exibido, rank.links);
  const dif = nr.reduce((s, v, k) => s + Math.abs(v - rank.exibido[k]), 0);
  rank.exibido = nr; rank.iteracao++;
  if (dif < 5e-4) convergirRank();
  atualizarLeituraRank();
  return true;
}

function adicionarLink(destino) {
  // A página mais importante que ainda não aponta para o destino passa a apontar.
  const jaApontam = new Set(rank.links.filter(l => l[1] === destino).map(l => l[0]));
  const candidatas = PAGINAS.map((_, i) => i).filter(i => i !== destino && !jaApontam.has(i));
  if (!candidatas.length) {
    rank.mensagem = `Todas as páginas já apontam para ${PAGINAS[destino]}.`;
    atualizarLeituraRank();
    return;
  }
  candidatas.sort((a, b) => rank.r[b] - rank.r[a]);
  const origem = candidatas[0];
  rank.links.push([origem, destino]);
  rank.r = pagerankConvergido(rank.links);
  rank.estavel = false;
  rank.novo = destino;
  rank.mensagem = `Novo link: ${PAGINAS[origem]} → ${PAGINAS[destino]}.`;
  if (movimentoReduzido.matches || !cena3d) convergirRank();
  atualizarLeituraRank();
  if (cena3d) cena3d.estacao6.reconstruirArestas();
  pedirQuadro();
}

function montarRanking() {
  $('#ranking').innerHTML = PAGINAS.map((p, i) =>
    `<button type="button" class="pagina" data-pagina="${i}" aria-label="Página ${p}: adicionar um link para ela">` +
    `<span class="pos"></span><span class="nome">${p}</span><span class="pct"></span></button>`).join('');
  $('#ranking').addEventListener('click', e => {
    const b = e.target.closest('[data-pagina]');
    if (b) adicionarLink(+b.dataset.pagina);
  });
}

function atualizarLeituraRank() {
  const pct = percentuais(rank.exibido);
  const ordem = PAGINAS.map((_, i) => i).sort((a, b) => rank.exibido[b] - rank.exibido[a]);
  ordem.forEach((i, pos) => {
    const b = $(`[data-pagina="${i}"]`);
    b.style.order = pos;
    b.querySelector('.pos').textContent = `${pos + 1}º`;
    b.querySelector('.pct').textContent = `${pct[i]}%`;
    b.classList.toggle('nova', i === rank.novo);
    b.setAttribute('aria-label', `${pos + 1}º lugar, página ${PAGINAS[i]}, ${pct[i]}%. Adicionar um link para ela.`);
  });
  const estado = rank.estavel ? `equilíbrio na iteração ${rank.iteracao}` : `iteração ${rank.iteracao}…`;
  $('#leitura-rank').textContent = `${rank.mensagem ? rank.mensagem + ' ' : ''}${estado} · d = 0,85 · soma = 100%`;
}

/* =====================================================================
   Rolagem, seções HTML, barra de progresso e teclado
   ===================================================================== */

const trilha = $('#trilha');
const palco = $('#palco');
const secoes = $$('.estacao');
const paradas = $$('.parada');
const linksBarra = $$('.barra-lista a');
const estado = {
  alvo: 0,        // progresso p vindo da rolagem (0 a 1)
  atual: 0,       // progresso suavizado usado pela câmera
  ativa: -1,
  ativacao: new Array(N).fill(-Infinity), // instante em que cada estação ficou ativa (animação de entrada)
  focoPendente: -1,
};

// Cada estação ocupa uma tela de rolagem; as que têm passos internos (estação 1) ocupam mais.
// Enquanto a rolagem percorre os passos, a câmera fica parada na estação e só o passo muda.
function trecho(i) {
  const tela = paradas[1].offsetTop - paradas[0].offsetTop;
  const topo = paradas[i].offsetTop;
  const espera = i < N - 1 ? paradas[i + 1].offsetTop - topo - tela : 0;
  return { tela, topo, espera };
}

function lerRolagem() {
  const y = window.scrollY - trilha.offsetTop;
  let i = 0;
  while (i < N - 1 && y >= paradas[i + 1].offsetTop) i++;
  const { tela, topo, espera } = trecho(i);
  if (!tela) return { p: 0, passo: 0 };
  const local = Math.max(0, y - topo);
  const viagem = i < N - 1 ? limitar((local - espera) / tela, 0, 1) : 0;
  // ao partir para a próxima estação, o passo volta a 0 (zoom-out)
  const passo = viagem > 0.12 ? 0 : Math.round(Math.min(local, espera) / tela);
  return { p: (i + viagem) / (N - 1), passo, i };
}

function progressoDaRolagem() {
  const r = lerRolagem();
  if (r.i !== undefined) Object.keys(PASSOS).forEach(k => mudarPasso(+k, +k === r.i ? r.passo : 0));
  return r.p;
}

function topoDoProgresso(p) {
  const sP = limitar(p, 0, 1) * (N - 1), i = Math.min(N - 1, Math.floor(sP + 1e-9)), frac = sP - i;
  const { tela, topo, espera } = trecho(i);
  return trilha.offsetTop + topo + (frac > 1e-6 ? espera + frac * tela : 0);
}

function atualizarSecoes() {
  const sP = estado.alvo * (N - 1);
  const ativa = limitar(Math.round(sP), 0, N - 1);
  const reduz = movimentoReduzido.matches;
  secoes.forEach((sec, i) => {
    const d = sP - i;
    const op = limitar(1 - Math.abs(d) * 2.2, 0, 1);
    sec.style.opacity = op.toFixed(3);
    sec.style.transform = reduz ? '' : `translateX(${(-d * 48).toFixed(1)}px)`;
    sec.style.visibility = op > 0.01 ? 'visible' : 'hidden';
    const eAtiva = i === ativa;
    sec.classList.toggle('ativa', eAtiva);
    sec.inert = !eAtiva;
    if (eAtiva) sec.removeAttribute('aria-hidden'); else sec.setAttribute('aria-hidden', 'true');
  });
  if (ativa !== estado.ativa) {
    estado.ativa = ativa;
    estado.ativacao[ativa] = performance.now();
    linksBarra.forEach((a, i) => { if (i === ativa) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); });
    $('#barra-atual').textContent = linksBarra[ativa].querySelector('.rotulo-barra').textContent;
    document.body.classList.toggle('arrastavel', ativa >= 4 && ativa <= 6);
  }
  $('#barra-preenchida').style.width = `${(estado.alvo * 100).toFixed(2)}%`;
  if (estado.focoPendente === ativa && Math.abs(sP - ativa) < 0.05) {
    estado.focoPendente = -1;
    secoes[ativa].focus({ preventScroll: true });
  }
}

function aoRolar() {
  estado.alvo = progressoDaRolagem();
  if (movimentoReduzido.matches) estado.atual = estado.alvo;
  atualizarSecoes();
  pedirQuadro();
}

function irPara(i, { focar = false, instantaneo = false } = {}) {
  i = limitar(i, 0, N - 1);
  const topo = trilha.offsetTop + paradas[i].offsetTop;
  if (focar) estado.focoPendente = i;
  window.scrollTo({ top: topo, behavior: instantaneo || movimentoReduzido.matches ? 'instant' : 'smooth' });
  if (instantaneo) aoRolar();
}

function ligarNavegacao() {
  window.addEventListener('scroll', aoRolar, { passive: true });
  $$('[data-estacao]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    irPara(+a.dataset.estacao, { focar: true });
  }));
  document.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const alvo = e.target;
    if (alvo.closest && alvo.closest('input, textarea, select, [contenteditable]')) return;
    const atual = limitar(Math.round(estado.alvo * (N - 1)), 0, N - 1);
    let prox = null;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') prox = atual + 1;
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') prox = atual - 1;
    if (prox === null) return;
    e.preventDefault();
    const { tela, topo, espera } = trecho(atual);
    const passos = Math.round(espera / tela), passoAtual = lerRolagem().passo, novo = passoAtual + (prox > atual ? 1 : -1);
    if (passos > 0 && novo >= 0 && novo <= passos) {
      window.scrollTo({ top: trilha.offsetTop + topo + novo * tela, behavior: movimentoReduzido.matches ? 'instant' : 'smooth' });
      return;
    }
    irPara(prox, { focar: true });
  });
}

/* =====================================================================
   Cena 3D
   ===================================================================== */

let cena3d = null;
let rafId = 0;
let iniciado = false; // vira true quando a tentativa de montar o 3D termina

function pedirQuadro() {
  if (!cena3d || rafId || document.hidden) return;
  rafId = requestAnimationFrame(quadro);
}

function quadro(t) {
  rafId = 0;
  const continuar = passo(t, false);
  if (continuar) pedirQuadro();
}

// Avança tudo um quadro. Com final = true, desenha cada estação no estado final.
function passo(agora, final) {
  let ocupado = false;
  if (final) {
    estado.atual = estado.alvo;
    estado.ativacao.fill(-Infinity);
    notas.exibido = notas.previsto.map(l => l.slice());
    explorar.atual = explorar.alvo;
    if (!rank.estavel) { convergirRank(); atualizarLeituraRank(); }
  }
  // Câmera: lerp até o progresso da rolagem (salto direto com movimento reduzido)
  if (movimentoReduzido.matches) estado.atual = estado.alvo;
  else {
    const dif = estado.alvo - estado.atual;
    if (Math.abs(dif) > 1e-5) { estado.atual += dif * 0.12; ocupado = true; } else estado.atual = estado.alvo;
  }
  // Estação 4: as barras previstas perseguem a previsão nova
  notas.exibido.forEach((l, i) => l.forEach((v, j) => {
    const d = notas.previsto[i][j] - v;
    if (Math.abs(d) > 1e-3) { l[j] = v + d * 0.14; ocupado = true; } else l[j] = notas.previsto[i][j];
  }));
  // Estação 5: a sua seta persegue o controle
  { const d = explorar.alvo - explorar.atual;
    if (Math.abs(d) > 0.05) { explorar.atual += d * 0.18; ocupado = true; } else explorar.atual = explorar.alvo; }
  // Estação 6: uma iteração de potência por vez, só com a estação à vista
  const sP = estado.atual * (N - 1);
  if (Math.abs(sP - 6) < 1.5 && !rank.estavel) { passoRank(agora); ocupado = true; }
  if (cena3d) ocupado = cena3d.desenhar(agora, final) || ocupado;
  return ocupado;
}

async function iniciar3d() {
  let THREE;
  try {
    THREE = await import('./lib/three.module.min.js');
  } catch (err) {
    console.warn('Three.js não carregou; seguindo só com o HTML.', err);
    return null;
  }
  const canvas = $('#cena');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (err) {
    console.warn('WebGL indisponível; seguindo só com o HTML.', err);
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(COR.fundo, 10, 30);
  const FOV = 40;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
  const TAN = Math.tan(FOV * Math.PI / 360);

  // ---------- auxiliares de geometria ----------
  const matBasico = (cor, extra = {}) => new THREE.MeshBasicMaterial({ color: cor, side: THREE.DoubleSide, ...extra });
  const matLinha = (cor, extra = {}) => new THREE.LineBasicMaterial({ color: cor, ...extra });

  // Barra retangular entre dois pontos alinhados aos eixos (traços da marca).
  function barra(x1, y1, x2, y2, larg, mat) {
    const comp = Math.hypot(x2 - x1, y2 - y1) + larg;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(comp, larg), mat);
    m.position.set((x1 + x2) / 2, (y1 + y2) / 2, 0);
    m.rotation.z = Math.atan2(y2 - y1, x2 - x1);
    return m;
  }

  // Colchete "[" (lado = -1) ou "]" (lado = 1), centrado em x, com meia altura h e braço b.
  function colchete(x, h, b, larg, lado, mat) {
    const g = new THREE.Group();
    g.add(barra(x, -h, x, h, larg, mat));
    g.add(barra(x, h, x - lado * b, h, larg, mat));
    g.add(barra(x, -h, x - lado * b, -h, larg, mat));
    return g;
  }

  // Fita (faixa plana) seguindo uma polilinha no plano XY, com largura variável.
  function fita(pontos, largura, mat) {
    const pos = new Float32Array(pontos.length * 2 * 3);
    const idx = [];
    for (let i = 0; i < pontos.length; i++) {
      const a = pontos[Math.max(0, i - 1)], b = pontos[Math.min(pontos.length - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1];
      const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      const w = largura(pontos[i][0]) / 2;
      pos.set([pontos[i][0] - ty * w, pontos[i][1] + tx * w, 0, pontos[i][0] + ty * w, pontos[i][1] - tx * w, 0], i * 6);
      if (i < pontos.length - 1) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setIndex(idx);
    return new THREE.Mesh(geo, mat);
  }

  // ---------- as duas linhas paralelas que atravessam a cena ----------
  // meia distância entre as linhas ao longo de X (quadros-chave suavizados)
  const CHAVES = [
    [-99, 0.525], [8, 0.525], [11, 2.0], [17, 2.0], [20, 0.525],          // 1: teoria × aplicação
    [23.5, 0.525], [25.5, 1.3], [30.5, 1.3], [32.5, 0.525],               // 2: degraus
    [37, 0.525], [39.6, 1.1], [44.4, 1.1], [47, 0.525],                    // 3: portal
    [50, 0.525], [53.5, 3.6], [86.5, 3.6], [93.5, 0.525], [999, 0.525],    // 4–6 abertas; 7 reaproximam
  ];
  function meiaDist(x) {
    for (let i = 0; i < CHAVES.length - 1; i++) {
      const [x0, y0] = CHAVES[i], [x1, y1] = CHAVES[i + 1];
      if (x <= x1) return lerp(y0, y1, suave(limitar((x - x0) / (x1 - x0), 0, 1)));
    }
    return 0.525;
  }
  const larguraLinha = x => lerp(0.05, 0.3, suave(limitar((x - 92) / 4.5, 0, 1)));
  const matLinhas = matBasico(COR.ciano);
  const linhas = new THREE.Group();
  const fitas = [1, -1].map(sinal => {
    const pts = [];
    for (let x = 0; x <= FIM_LINHAS + 1e-6; x += 0.12) pts.push([x, sinal * meiaDist(x)]);
    pts.push([FIM_LINHAS, sinal * meiaDist(FIM_LINHAS)]);
    const f = fita(pts, larguraLinha, matLinhas);
    linhas.add(f);
    return f;
  });
  const totalIndices = fitas[0].geometry.index.count;
  scene.add(linhas);

  const rotulosEl = $('#rotulos');
  const rotulos = []; // {el, estacao, obj, deslocY, ancora}
  function rotulo(texto, estacao, obj, { deslocY = 0, ancora = 'centro', forte = false } = {}) {
    const el = document.createElement('span');
    el.className = 'rotulo3d' + (forte ? ' forte' : '');
    el.textContent = texto;
    rotulosEl.appendChild(el);
    const r = { el, estacao, obj, deslocY, ancora };
    rotulos.push(r);
    return r;
  }

  const estacoes = [];
  function novaEstacao(i, raio, focoX = 0) {
    const grupo = new THREE.Group();
    grupo.position.set(i * PASSO, 0, 0);
    scene.add(grupo);
    const e = { i, grupo, raio, focoX, raioBase: raio, focoBase: focoX, camY: 0, atualizar: () => false, girar: null };
    estacoes[i] = e;
    return e;
  }

  // ---------- 0 · Quem somos: dois pontos viram as linhas ----------
  {
    const e = novaEstacao(0, 2.6, 2.4);
    const pontos = [1, -1].map(s => {
      const m = new THREE.Mesh(new THREE.CircleGeometry(0.13, 24), matBasico(COR.ciano));
      m.position.set(0, s * 0.525, 0.01);
      e.grupo.add(m);
      return m;
    });
    // abertura: os pontos surgem e as linhas disparam para a direita (uma vez, ao carregar)
    e.introInicio = -Infinity;
    e.atualizar = (agora, final) => {
      const t = final || movimentoReduzido.matches ? 99 : (agora - e.introInicio) / 1000;
      const sPontos = suave(limitar(t / 0.35, 0, 1));
      pontos.forEach(p => p.scale.setScalar(Math.max(0.001, sPontos)));
      const sLinhas = limitar((t - 0.35) / 1.4, 0, 1);
      const cont = sLinhas >= 1 ? totalIndices : Math.floor(totalIndices * (1 - Math.pow(1 - sLinhas, 3)) / 6) * 6;
      fitas.forEach(f => f.geometry.setDrawRange(0, cont));
      return t < 1.8;
    };
  }

  // ---------- 1 · O problema: teoria × aplicação ----------
  {
    const e = novaEstacao(1, 2.9);
    const alto = new THREE.Object3D(); alto.position.set(0, 2.0, 0);
    const baixo = new THREE.Object3D(); baixo.position.set(0, -2.0, 0);
    e.grupo.add(alto, baixo);
    rotulo('teoria', 1, alto, { deslocY: -16, forte: true });
    const rotuloAplicacao = rotulo('aplicação', 1, baixo, { deslocY: 16, forte: true });
    // o vão entre as linhas, marcado por um tracejado vertical discreto
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 1.75, 0), new THREE.Vector3(0, -1.75, 0)]);
    const matVao = new THREE.LineDashedMaterial({ color: COR.aux, dashSize: 0.18, gapSize: 0.14, transparent: true, opacity: 0.6 });
    const vao = new THREE.Line(geo, matVao);
    vao.computeLineDistances();
    e.grupo.add(vao);

    // Mergulho: três ideias da teoria (em cima), três práticas (embaixo) e as pontes que faltam.
    const camadas = [COR.texto, COR.azul, COR.violeta].map(cor => ({
      linha: matLinha(cor, { transparent: true, opacity: 0 }),
      cheio: matBasico(cor, { transparent: true, opacity: 0 }),
      op: 0,
    }));
    const [teoria, pratica, ponte] = camadas;
    // no passo da teoria a câmera sobe; o rótulo de baixo some para não cair sobre a barra
    rotuloAplicacao.fator = () => limitar(1 - teoria.op + pratica.op, 0, 1);
    const tracos = (pares, mat, x, y) => {
      const pts = pares.flat().map(([a, b]) => new THREE.Vector3(a, b, 0.02));
      const l = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), mat);
      l.position.set(x, y, 0);
      e.grupo.add(l);
      return l;
    };
    const contorno = pts => pts.map((p, k) => [p, pts[(k + 1) % pts.length]]);
    const no = (x, y, camada) => { const m = new THREE.Mesh(new THREE.CircleGeometry(0.07, 20), camada.cheio); m.position.set(x, y, 0.02); e.grupo.add(m); };
    const XS = [-1.35, 0, 1.35], YT = 1.3, YP = -1.3;
    // teoria: vetor, matriz, transformação
    tracos([[[-0.26, -0.2], [0.26, 0.2]], [[0.26, 0.2], [0.08, 0.19]], [[0.26, 0.2], [0.2, 0.03]]], teoria.linha, XS[0], YT);
    tracos([[[-0.2, 0.26], [-0.28, 0.26]], [[-0.28, 0.26], [-0.28, -0.26]], [[-0.28, -0.26], [-0.2, -0.26]],
            [[0.2, 0.26], [0.28, 0.26]], [[0.28, 0.26], [0.28, -0.26]], [[0.28, -0.26], [0.2, -0.26]],
            [[-0.15, 0.1], [-0.05, 0.1]], [[0.05, 0.1], [0.15, 0.1]], [[-0.15, -0.1], [-0.05, -0.1]], [[0.05, -0.1], [0.15, -0.1]]], teoria.linha, XS[1], YT);
    tracos([...contorno([[-0.3, -0.2], [0, -0.2], [0, 0.1], [-0.3, 0.1]]), ...contorno([[0.02, -0.2], [0.3, -0.2], [0.42, 0.22], [0.14, 0.22]])], teoria.linha, XS[2] - 0.05, YT);
    // prática: personagem que anda, foto, cena 3D
    tracos([...contorno([[0.3, 0], [-0.05, 0.17], [0.03, 0], [-0.05, -0.17]]), [[-0.14, 0], [-0.2, 0]], [[-0.26, 0], [-0.32, 0]]], pratica.linha, XS[0], YP);
    tracos([...contorno([[-0.27, -0.27], [0.27, -0.27], [0.27, 0.27], [-0.27, 0.27]]),
            [[-0.09, -0.27], [-0.09, 0.27]], [[0.09, -0.27], [0.09, 0.27]], [[-0.27, -0.09], [0.27, -0.09]], [[-0.27, 0.09], [0.27, 0.09]]], pratica.linha, XS[1], YP);
    tracos([...contorno([[-0.26, -0.26], [0.1, -0.26], [0.1, 0.1], [-0.26, 0.1]]), ...contorno([[-0.1, -0.1], [0.26, -0.1], [0.26, 0.26], [-0.1, 0.26]]),
            [[-0.26, -0.26], [-0.1, -0.1]], [[0.1, -0.26], [0.26, -0.1]], [[0.1, 0.1], [0.26, 0.26]], [[-0.26, 0.1], [-0.1, 0.26]]], pratica.linha, XS[2], YP);
    const nomesTeoria = ['vetores', 'matrizes', 'transformações'], nomesPratica = ['movimento', 'imagem', 'cena 3D'];
    XS.forEach((x, k) => {
      no(x, 2.0, teoria); no(x, -2.0, pratica);
      tracos([[[0, 2.0 - YT], [0, 0.42]]], teoria.linha, x, YT);
      tracos([[[0, -2.0 - YP], [0, -0.42]]], pratica.linha, x, YP);
      const a = new THREE.Object3D(); a.position.set(x, YT - 0.55, 0); e.grupo.add(a);
      const b = new THREE.Object3D(); b.position.set(x, YP + 0.55, 0); e.grupo.add(b);
      rotulo(nomesTeoria[k], 1, a, { forte: true }).fator = () => teoria.op;
      rotulo(nomesPratica[k], 1, b, { forte: true }).fator = () => pratica.op;
      // a ponte que falta: tracejado curto com "?" no meio
      const segs = [];
      for (let y = 0.5; y > 0.14; y -= 0.14) segs.push([[0, y], [0, y - 0.07]], [[0, -y], [0, -y + 0.07]]);
      tracos(segs, ponte.linha, x, 0);
      const c = new THREE.Object3D(); c.position.set(x, 0, 0); e.grupo.add(c);
      rotulo('?', 1, c, { forte: true }).fator = () => ponte.op;
    });

    e.atualizar = (agora, final) => {
      const direto = final || movimentoReduzido.matches;
      let ocupado = false;
      const seguir = (atual, destino, k) => {
        if (direto || Math.abs(destino - atual) < 1e-3) return destino;
        ocupado = true;
        return atual + (destino - atual) * k;
      };
      camadas.forEach((c, k) => {
        c.op = seguir(c.op, passoAtual[1] > k ? 1 : 0, 0.1);
        c.linha.opacity = c.cheio.opacity = c.op;
      });
      matVao.opacity = 0.6 * (1 - teoria.op);
      return ocupado;
    };
  }

  // ---------- 2 · O que entregamos: 4 degraus ----------
  {
    const e = novaEstacao(2, 3.0);
    const degraus = [-2.25, -0.75, 0.75, 2.25].map(x => {
      const m = barra(x, 1.3, x, -1.3, 0.06, matBasico(COR.texto));
      e.grupo.add(m);
      return m;
    });
    e.atualizar = (agora, final) => {
      const t = final || movimentoReduzido.matches ? 99 : (agora - estado.ativacao[2]) / 1000;
      degraus.forEach((d, k) => {
        const s = suave(limitar((t - k * 0.18) / 0.4, 0, 1));
        d.scale.x = Math.max(0.001, s); // a barra é vertical: o eixo local x é o comprimento
        d.material.color.setHex(passoAtual[2] === k + 1 ? COR.ciano : COR.texto); // entrega em foco
      });
      return t < 1.2;
    };
  }

  // ---------- 3 · Início: portal [ ] ----------
  {
    const e = novaEstacao(3, 3.3);
    const mat = matBasico(COR.texto, { transparent: true });
    const portal = new THREE.Group();
    portal.add(colchete(-3.0, 2.6, 0.9, 0.16, -1, mat), colchete(3.0, 2.6, 0.9, 0.16, 1, mat));
    portal.position.z = 0.02;
    e.grupo.add(portal);
    e.atualizar = (agora, final, sP) => {
      const t = final || movimentoReduzido.matches ? 99 : (agora - estado.ativacao[3]) / 1000;
      const entrada = suave(limitar(t / 0.6, 0, 1));
      const saida = limitar(sP - 3, 0, 1); // ao seguir para a estação 4, o portal cresce e passa pela câmera
      portal.scale.setScalar(lerp(0.75, 1, entrada) * (1 + saida * 3.2));
      mat.opacity = limitar(1 - saida * 1.4, 0, 1);
      return t < 0.7;
    };
  }

  // ---------- 4 · Unidade I: matriz de notas em barras (pessoas × filmes) ----------
  {
    const e = novaEstacao(4, 2.7);
    const conjunto = new THREE.Group();
    conjunto.rotation.set(0.55, -0.3, 0);
    e.grupo.add(conjunto);
    e.girar = conjunto;
    e.base = { x: 0.55, y: -0.3 };
    const DX = 0.95, DZ = 0.85, LADO = 0.56, ALT = 0.34; // 1 ponto de nota = ALT de altura
    const x0 = -DX * (FILMES.length - 1) / 2, z0 = -DZ * (PESSOAS.length - 1) / 2;
    const chao = new THREE.Mesh(new THREE.PlaneGeometry(DX * FILMES.length + 0.3, DZ * PESSOAS.length + 0.3), matBasico(COR.borda, { transparent: true, opacity: 0.35, depthWrite: false }));
    chao.rotation.x = -Math.PI / 2; chao.position.y = -0.85;
    conjunto.add(chao);
    const geoCaixa = new THREE.BoxGeometry(LADO, 1, LADO);
    const geoBorda = new THREE.EdgesGeometry(geoCaixa);
    const barras = PESSOAS.map((_, i) => FILMES.map((_, j) => {
      const g = new THREE.Group();
      // "Você" fica na fileira da frente
      g.position.set(x0 + j * DX, -0.85, z0 + (PESSOAS.length - 1 - i) * DZ);
      const cheio = new THREE.Mesh(geoCaixa, matBasico(COR.azul, { transparent: true, opacity: 0.85 }));
      const borda = new THREE.LineSegments(geoBorda, matLinha(COR.texto, { transparent: true, opacity: 0.5 }));
      g.add(cheio, borda);
      conjunto.add(g);
      const topo = new THREE.Object3D(); g.add(topo);
      const r = i === 0 ? rotulo('', 4, topo, { deslocY: -12, forte: true }) : null;
      return { g, cheio, borda, topo, r };
    }));
    FILMES.forEach((f, j) => { const o = new THREE.Object3D(); o.position.set(x0 + j * DX, -0.85, z0 + (PESSOAS.length - 1) * DZ + 0.62); conjunto.add(o); rotulo(f, 4, o, { deslocY: 10 }); });
    PESSOAS.forEach((nome, i) => { const o = new THREE.Object3D(); o.position.set(x0 - 0.75, -0.8, z0 + (PESSOAS.length - 1 - i) * DZ); conjunto.add(o); rotulo(nome, 4, o, { forte: i === 0 }); });
    e.atualizar = () => {
      const mostrar = passoAtual[4] >= 1; // no passo 0 os buracos ainda são "?"
      barras.forEach((linha, i) => linha.forEach((b, j) => {
        const conhecida = notas.R[i][j] > 0;
        const valor = conhecida ? notas.R[i][j] : (mostrar ? notas.exibido[i][j] : 0.25);
        const h = Math.max(0.02, valor * ALT);
        b.g.scale.y = h; b.g.children.forEach(c => { c.position.y = 0.5; });
        b.topo.position.y = 1;
        b.cheio.material.color.setHex(conhecida ? (i === 0 ? COR.ciano : COR.azul) : COR.violeta);
        b.cheio.material.opacity = conhecida ? (i === 0 ? 0.9 : 0.55) : 0.35;
        b.borda.material.color.setHex(conhecida ? COR.texto : COR.violeta);
        b.borda.material.opacity = conhecida ? 0.35 : 0.9;
        if (b.r) {
          const t = conhecida ? String(notas.R[i][j]) : (mostrar ? fmt(notas.exibido[i][j], 1) : '?');
          if (b.r.el.textContent !== t) b.r.el.textContent = t;
          b.r.el.style.color = conhecida ? '' : 'var(--violet)';
        }
      }));
      return false;
    };
  }

  // ---------- 5 · Unidade II: contas como setas; a sua seta escolhe as vizinhas ----------
  {
    const e = novaEstacao(5, 2.0);
    const conjunto = new THREE.Group();
    conjunto.rotation.set(-0.28, 0.2, 0);
    e.grupo.add(conjunto);
    e.girar = conjunto;
    e.base = { x: -0.28, y: 0.2 };
    const plano = new THREE.Group();
    plano.position.set(-1.25, -1.25, 0); // origem dos eixos no canto inferior esquerdo
    conjunto.add(plano);
    const EIXO = 2.7;
    const eixos = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([[0, 0], [EIXO, 0], [0, 0], [0, EIXO]].map(([x, y]) => new THREE.Vector3(x, y, 0))), matLinha(COR.aux, { transparent: true, opacity: 0.6 }));
    plano.add(eixos);
    const ex = new THREE.Object3D(); ex.position.set(EIXO, 0, 0); plano.add(ex); rotulo('esporte →', 5, ex, { deslocY: 14 });
    const ey = new THREE.Object3D(); ey.position.set(0, EIXO, 0); plano.add(ey); rotulo('↑ humor', 5, ey, { deslocY: -12 });
    const rad = g => g * Math.PI / 180;
    const seta = (cor, larg) => { const m = barra(0, 0, 1, 0, larg, matBasico(cor, { transparent: true })); const g = new THREE.Group(); g.add(m); plano.add(g); return { g, m }; };
    const contas = CONTAS.map(c => {
      const s = seta(COR.aux, 0.03);
      s.g.rotation.z = rad(c.ang); s.g.scale.x = c.tam; s.m.position.x = 0.5; s.m.scale.x = 1 / (1 + 0.03);
      const ponta = new THREE.Mesh(new THREE.CircleGeometry(0.07, 20), matBasico(COR.aux));
      ponta.position.set(Math.cos(rad(c.ang)) * c.tam, Math.sin(rad(c.ang)) * c.tam, 0.01);
      plano.add(ponta);
      const o = new THREE.Object3D(); o.position.copy(ponta.position); plano.add(o);
      const r = rotulo(c.nome, 5, o, { deslocY: -14 });
      return { ...s, ponta, r };
    });
    const voce = seta(COR.ciano, 0.07);
    voce.m.position.x = 0.5; voce.g.scale.x = 1.8; voce.g.position.z = 0.02;
    const pontaVoce = new THREE.Object3D(); plano.add(pontaVoce);
    rotulo('você', 5, pontaVoce, { deslocY: 14, forte: true });
    // arco do ângulo entre você e a conta mais alinhada
    const geoArco = new THREE.BufferGeometry();
    geoArco.setAttribute('position', new THREE.BufferAttribute(new Float32Array(25 * 3), 3));
    const arco = new THREE.Line(geoArco, matLinha(COR.violeta));
    plano.add(arco);
    e.atualizar = () => {
      const a = explorar.atual;
      voce.g.rotation.z = rad(a);
      pontaVoce.position.set(Math.cos(rad(a)) * 1.8, Math.sin(rad(a)) * 1.8, 0);
      const cos = CONTAS.map(c => Math.cos(rad(c.ang - a)));
      const ordem = CONTAS.map((_, k) => k).sort((p, q) => cos[q] - cos[p]);
      contas.forEach((c, k) => {
        const pos = ordem.indexOf(k), dentro = pos < 2;
        const cor = dentro ? COR.azul : COR.aux;
        c.m.material.color.setHex(cor); c.m.material.opacity = dentro ? 1 : 0.45;
        c.ponta.material.color.setHex(cor);
        c.r.el.style.color = dentro ? 'var(--paper)' : '';
      });
      const melhor = CONTAS[ordem[0]].ang, pos = geoArco.attributes.position;
      for (let t = 0; t < 25; t++) { const g = rad(lerp(a, melhor, t / 24)); pos.setXYZ(t, Math.cos(g) * 0.9, Math.sin(g) * 0.9, 0.02); }
      pos.needsUpdate = true;
      return false;
    };
  }

  // ---------- 6 · Unidade III: grafo de 5 páginas e PageRank ----------
  const estacao6 = (() => {
    const e = novaEstacao(6, 3.1);
    const conjunto = new THREE.Group();
    conjunto.rotation.set(0.25, 0, 0);
    e.grupo.add(conjunto);
    e.girar = conjunto;
    e.base = { x: 0.25, y: 0 };
    const zs = [0.6, -0.5, 0.45, -0.6, 0.2];
    const posicoes = PAGINAS.map((_, k) => {
      const a = Math.PI / 2 + k * 2 * Math.PI / 5;
      return new THREE.Vector3(Math.cos(a) * 2.2, Math.sin(a) * 2.0, zs[k]);
    });
    const geoNo = new THREE.SphereGeometry(1, 20, 14);
    const nos = posicoes.map((p, k) => {
      const m = new THREE.Mesh(geoNo, matBasico(COR.azul));
      m.position.copy(p);
      conjunto.add(m);
      const ancora = new THREE.Object3D();
      conjunto.add(ancora);
      rotulo(PAGINAS[k], 6, ancora, { forte: true });
      m.userData.ancora = ancora;
      return m;
    });
    const arestas = new THREE.Group();
    conjunto.add(arestas);
    const matAresta = matLinha(COR.aux, { transparent: true, opacity: 0.55 });
    const matSeta = matBasico(COR.aux);
    const geoSeta = new THREE.ConeGeometry(0.09, 0.26, 10);
    const Y = new THREE.Vector3(0, 1, 0);
    let particulas = null;
    const POR_ARESTA = 3;
    function raio(k) { return 0.16 + 1.25 * rank.exibido[k]; }
    function reconstruirArestas() {
      arestas.clear();
      if (particulas) { conjunto.remove(particulas); particulas.geometry.dispose(); }
      rank.links.forEach(([de, para]) => {
        const g = new THREE.Group();
        const linha = new THREE.Line(new THREE.BufferGeometry().setFromPoints([posicoes[de], posicoes[para]]), matAresta);
        const seta = new THREE.Mesh(geoSeta, matSeta);
        g.add(linha, seta);
        g.userData = { de, para, seta };
        arestas.add(g);
      });
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(rank.links.length * POR_ARESTA * 3), 3));
      particulas = new THREE.Points(geo, new THREE.PointsMaterial({ color: COR.ciano, size: 0.09, transparent: true, opacity: 0.9 }));
      conjunto.add(particulas);
    }
    reconstruirArestas();
    e.atualizar = (agora, final) => {
      const maior = rank.exibido.indexOf(Math.max(...rank.exibido));
      nos.forEach((m, k) => {
        const r = raio(k);
        m.scale.setScalar(r);
        m.material.color.setHex(k === maior ? COR.ciano : COR.azul);
        m.userData.ancora.position.copy(posicoes[k]);
      });
      arestas.children.forEach(g => {
        const { de, para, seta } = g.userData;
        const dir = posicoes[para].clone().sub(posicoes[de]).normalize();
        seta.position.copy(posicoes[para]).addScaledVector(dir, -(raio(para) + 0.14));
        seta.quaternion.setFromUnitVectors(Y, dir);
      });
      // partículas correm pelos links, mais rápido saindo das páginas mais importantes
      const semMovimento = movimentoReduzido.matches;
      particulas.visible = !semMovimento;
      if (!semMovimento) {
        const arr = particulas.geometry.attributes.position.array;
        const out = saidas(rank.links);
        rank.links.forEach(([de, para], k) => {
          const vel = 0.25 + 1.6 * rank.exibido[de] / out[de].length;
          for (let j = 0; j < POR_ARESTA; j++) {
            const f = final ? (j + 0.5) / POR_ARESTA : (agora / 1000 * vel + j / POR_ARESTA + k * 0.137) % 1;
            const p = posicoes[de].clone().lerp(posicoes[para], f);
            arr.set([p.x, p.y, p.z], (k * POR_ARESTA + j) * 3);
          }
        });
        particulas.geometry.attributes.position.needsUpdate = true;
      }
      return !semMovimento;
    };
    // posição na tela de cada página, para tocar e adicionar um link
    e.noEmTela = (px, py) => {
      let melhor = -1, dist = Infinity;
      nos.forEach((m, k) => {
        const p = m.getWorldPosition(new THREE.Vector3()).project(camera);
        const sx = (p.x + 1) / 2 * largura, sy = (1 - p.y) / 2 * altura;
        const borda = m.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(m.scale.x, 0, 0)).project(camera);
        const rpx = Math.abs((borda.x - p.x) / 2 * largura);
        const d = Math.hypot(px - sx, py - sy);
        if (d < Math.max(28, rpx + 10) && d < dist) { dist = d; melhor = k; }
      });
      return melhor;
    };
    e.reconstruirArestas = reconstruirArestas;
    return e;
  })();

  // ---------- 7 · Fim: as linhas fecham o [=] ----------
  {
    const e = novaEstacao(7, 2.4);
    const mat = matBasico(COR.texto);
    const esq = colchete(-1.5, 1.5, 0.9, 0.3, -1, mat);
    const dir = colchete(1.5, 1.5, 0.9, 0.3, 1, mat);
    esq.position.z = dir.position.z = 0.02;
    e.grupo.add(esq, dir);
    e.atualizar = (agora, final) => {
      const t = final || movimentoReduzido.matches ? 99 : (agora - estado.ativacao[7]) / 1000;
      const s = suave(limitar(t / 0.9, 0, 1));
      esq.position.x = lerp(-2.4, 0, s);
      dir.position.x = lerp(2.4, 0, s);
      return t < 1;
    };
  }

  // ---------- 8 · Continue: marca parada sobre grade sutil ----------
  {
    const e = novaEstacao(8, 2.2);
    const pts = [];
    for (let v = -6; v <= 6; v++) pts.push(new THREE.Vector3(v, -6, -0.6), new THREE.Vector3(v, 6, -0.6), new THREE.Vector3(-6, v, -0.6), new THREE.Vector3(6, v, -0.6));
    e.grupo.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), matLinha(COR.borda, { transparent: true, opacity: 0.7 })));
    const marca = new THREE.Group();
    const matB = matBasico(COR.texto), matL = matBasico(COR.ciano);
    marca.add(colchete(-1.5, 1.5, 0.9, 0.3, -1, matB), colchete(1.5, 1.5, 0.9, 0.3, 1, matB));
    marca.add(barra(-0.825, 0.525, 0.825, 0.525, 0.3, matL), barra(-0.825, -0.525, 0.825, -0.525, 0.3, matL));
    marca.scale.setScalar(0.8);
    e.grupo.add(marca);
  }

  // ---------- enquadramento: onde cada estação aparece na tela ----------
  let largura = 1, altura = 1;
  const enquadres = new Array(N).fill(null).map(() => ({ cx: 0.5, cy: 0.5, tam: 300 }));

  function medir() {
    largura = palco.clientWidth || window.innerWidth;
    altura = palco.clientHeight || window.innerHeight;
    renderer.setSize(largura, altura, false);
    camera.aspect = largura / altura;
    const topo = desktop.matches ? 72 : 64, barraAlt = desktop.matches ? 72 : 80;
    secoes.forEach((sec, i) => {
      const texto = $('.texto', sec), ctrl = $('.controles', sec);
      let x0, x1, y0, y1;
      if (desktop.matches) {
        x0 = texto.offsetLeft + texto.offsetWidth + 32; x1 = largura - 32;
        y0 = topo; y1 = altura - barraAlt;
      } else {
        x0 = 0; x1 = largura;
        y0 = texto.offsetTop + texto.offsetHeight + 8;
        y1 = ctrl ? ctrl.offsetTop - 8 : altura - barraAlt;
        if (y1 - y0 < 150) { const meio = (y0 + y1) / 2; y0 = meio - 75; y1 = meio + 75; }
      }
      enquadres[i] = { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, tam: Math.max(120, Math.min(x1 - x0, y1 - y0) * 0.92) };
    });
  }

  function posicionarCamera(sP) {
    const a = limitar(Math.floor(sP), 0, N - 1), b = limitar(a + 1, 0, N - 1);
    const t = suave(limitar(sP - a, 0, 1));
    const ea = enquadres[a], eb = enquadres[b];
    const cx = lerp(ea.cx, eb.cx, t), cy = lerp(ea.cy, eb.cy, t);
    const distA = estacoes[a].raio * altura / (ea.tam * TAN), distB = estacoes[b].raio * altura / (eb.tam * TAN);
    const dist = limitar(lerp(distA, distB, t), 6, 60);
    const fx = lerp(estacoes[a].focoX, estacoes[b].focoX, t);
    const x = sP * PASSO + fx;
    const y = lerp(estacoes[a].camY || 0, estacoes[b].camY || 0, t);
    camera.position.set(x, y + dist * 0.08, dist);
    camera.lookAt(x, y, 0);
    camera.setViewOffset(largura, altura, largura / 2 - cx, altura / 2 - cy, largura, altura);
    camera.updateProjectionMatrix();
    scene.fog.near = dist - 1;
    scene.fog.far = dist + 18;
  }

  const vTmp = new THREE.Vector3();
  function atualizarRotulos(sP) {
    rotulos.forEach(r => {
      const op = limitar(1 - Math.abs(sP - r.estacao) * 2.2, 0, 1) * (r.fator ? r.fator() : 1);
      if (op <= 0.01) { r.el.style.opacity = 0; return; }
      r.obj.getWorldPosition(vTmp).project(camera);
      const x = (vTmp.x + 1) / 2 * largura, y = (1 - vTmp.y) / 2 * altura + r.deslocY;
      r.el.style.opacity = op.toFixed(3);
      r.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
    });
  }

  function desenhar(agora, final) {
    if (renderer.domElement.width === 0 || Math.abs(palco.clientWidth - largura) > 1 || Math.abs(palco.clientHeight - altura) > 1) medir();
    const sP = estado.atual * (N - 1);
    let ocupado = false;
    estacoes.forEach((e, i) => {
      const alvo = PASSOS[i]?.[passoAtual[i]];
      if (alvo) { // zoom do passo interno
        const direto = final || movimentoReduzido.matches;
        const seguir = (atual, destino) => {
          if (direto || Math.abs(destino - atual) < 1e-3) return destino;
          ocupado = true;
          return atual + (destino - atual) * 0.09;
        };
        e.raio = seguir(e.raio, e.raioBase * (alvo.zoom || 1));
        e.camY = seguir(e.camY, alvo.camY || 0);
        e.focoX = seguir(e.focoX, e.focoBase + (alvo.camX || 0));
      }
      const perto = Math.abs(sP - i) < 1.6;
      e.grupo.visible = perto;
      if (perto) ocupado = e.atualizar(agora, final, sP) || ocupado;
      // rotação do usuário + leve balanço (parado com movimento reduzido ou quadro final)
      if (e.girar) {
        const balanco = final || movimentoReduzido.matches ? 0 : Math.sin(agora / 2400 + i) * 0.06;
        e.girar.rotation.x = e.base.x + (e.rotUsuario?.x || 0);
        e.girar.rotation.y = e.base.y + (e.rotUsuario?.y || 0) + balanco;
        if (perto && !movimentoReduzido.matches) ocupado = true;
      }
    });
    // a estação 0 também cuida das linhas, que ficam visíveis em toda a viagem
    if (!estacoes[0].grupo.visible) estacoes[0].atualizar(agora, final);
    posicionarCamera(sP);
    renderer.render(scene, camera);
    atualizarRotulos(sP);
    return ocupado;
  }

  // ---------- arrastar para girar; tocar em uma página (estação 6) ----------
  let arrasto = null;
  canvas.addEventListener('pointerdown', ev => {
    const i = estado.ativa;
    if (!estacoes[i] || !estacoes[i].girar) return;
    arrasto = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, x0: ev.clientX, y0: ev.clientY, est: i, tipo: ev.pointerType, t: performance.now() };
    if (ev.pointerType === 'mouse') { canvas.setPointerCapture(ev.pointerId); document.body.classList.add('arrastando'); }
  });
  canvas.addEventListener('pointermove', ev => {
    if (!arrasto) {
      if (ev.pointerType === 'mouse' && estado.ativa === 6) document.body.classList.toggle('sobre-no', estacao6.noEmTela(ev.clientX, ev.clientY) >= 0);
      return;
    }
    if (ev.pointerId !== arrasto.id) return;
    const e = estacoes[arrasto.est];
    e.rotUsuario = e.rotUsuario || { x: 0, y: 0 };
    e.rotUsuario.y += (ev.clientX - arrasto.x) * 0.008;
    // no toque, só o movimento horizontal gira: o vertical continua rolando a página
    if (arrasto.tipo === 'mouse') e.rotUsuario.x = limitar(e.rotUsuario.x + (ev.clientY - arrasto.y) * 0.006, -0.9, 0.9);
    arrasto.x = ev.clientX; arrasto.y = ev.clientY;
    pedirQuadro();
  });
  const soltar = ev => {
    if (!arrasto || ev.pointerId !== arrasto.id) return;
    const toque = Math.hypot(ev.clientX - arrasto.x0, ev.clientY - arrasto.y0) < 8 && performance.now() - arrasto.t < 600;
    if (ev.type === 'pointerup' && toque && arrasto.est === 6) {
      const k = estacao6.noEmTela(ev.clientX, ev.clientY);
      if (k >= 0) adicionarLink(k);
    }
    arrasto = null;
    document.body.classList.remove('arrastando');
  };
  canvas.addEventListener('pointerup', soltar);
  canvas.addEventListener('pointercancel', soltar);

  medir();
  return { desenhar, medir, estacao6, iniciarIntro: () => { estacoes[0].introInicio = performance.now(); } };
}

/* =====================================================================
   Inicialização e API de depuração
   ===================================================================== */

function renderOnce() {
  estado.alvo = progressoDaRolagem();
  atualizarSecoes();
  if (cena3d) cena3d.medir();
  passo(performance.now(), true);
}

function seek(p) {
  p = limitar(+p || 0, 0, 1);
  window.scrollTo({ top: topoDoProgresso(p), behavior: 'instant' });
  estado.alvo = estado.atual = progressoDaRolagem();
  atualizarSecoes();
  renderOnce();
}

window.EL_EXP = {
  seek,
  passo: (i, passo) => { window.scrollTo({ top: trilha.offsetTop + paradas[i].offsetTop + Math.max(0, passo) * trecho(i).tela, behavior: 'instant' }); renderOnce(); },
  station: i => seek(limitar(Math.round(+i || 0), 0, N - 1) / (N - 1)),
  renderOnce,
};

async function principal() {
  prepararPassos();
  montarRanking();
  atualizarNotas();
  atualizarExplorar();
  $('#gosto').addEventListener('input', atualizarExplorar);
  $('#notas').addEventListener('click', ev => {
    const b = ev.target.closest('button[data-filme]');
    if (!b || b.disabled) return;
    const j = +b.dataset.filme;
    notas.R[0][j] = limitar(notas.R[0][j] + +b.dataset.d, 1, 5);
    atualizarNotas();
    $(`#notas button[data-filme="${j}"][data-d="${b.dataset.d}"]:not(:disabled)`)?.focus({ preventScroll: true });
  });
  $('#recomecar').addEventListener('click', reiniciarRank);
  ligarNavegacao();

  // ?s=N abre direto em uma estação
  const sParam = new URLSearchParams(location.search).get('s');
  const inicial = sParam !== null && /^\d+$/.test(sParam) ? limitar(+sParam, 0, N - 1) : null;
  if (inicial !== null) {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo({ top: trilha.offsetTop + paradas[inicial].offsetTop, behavior: 'instant' });
  }
  estado.alvo = estado.atual = progressoDaRolagem();
  atualizarSecoes();
  reiniciarRank();

  try {
    cena3d = await iniciar3d();
  } catch (err) {
    console.warn('Falha ao montar a cena 3D; seguindo só com o HTML.', err);
    cena3d = null;
  }
  iniciado = true;
  if (!cena3d) {
    // Sem 3D não há laço de animação: a leitura do PageRank mostra direto o equilíbrio.
    document.body.classList.add('sem-3d');
    convergirRank();
    atualizarLeituraRank();
    return;
  }

  estado.alvo = estado.atual = progressoDaRolagem();
  atualizarSecoes();
  window.addEventListener('resize', () => { cena3d.medir(); pedirQuadro(); });
  desktop.addEventListener('change', () => { cena3d.medir(); pedirQuadro(); });
  document.fonts?.ready.then(() => { cena3d.medir(); pedirQuadro(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(rafId); rafId = 0; } else pedirQuadro();
  });
  movimentoReduzido.addEventListener?.('change', () => { aoRolar(); pedirQuadro(); });
  renderOnce();
  // A abertura (pontos → linhas) só toca se a página começa na estação 0.
  if (estado.alvo < 0.02 && !movimentoReduzido.matches) cena3d.iniciarIntro();
  pedirQuadro();
}

principal();
