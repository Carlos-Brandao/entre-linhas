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
const fmt = (v, casas = 2) => (Math.abs(v) < 0.005 ? 0 : v).toFixed(casas).replace('-', '−');

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
    { eyebrow: 'Unidade I · na cadeira', titulo: 'Sistemas, determinante e eliminação.',
      corpo: 'Na ementa: sistemas de equações lineares, determinante, eliminação gaussiana, inversa e Gauss-Seidel (01.03 a 01.07).', zoom: 0.78 },
    { eyebrow: 'Unidade I · na prática', titulo: 'Várias condições ao mesmo tempo.',
      corpo: 'Descobrir preços a partir de totais, equilibrar um circuito, simular a temperatura de uma peça: tudo vira A x = b.', zoom: 0.9 },
    { eyebrow: 'Unidade I · mexa você', titulo: 'Repita uma nota e veja a resposta sumir.',
      corpo: 'Com duas notas iguais falta informação: os planos deixam de se cruzar em um só ponto e o determinante zera.', zoom: 1 },
  ],
  5: [
    { zoom: 1 },
    { eyebrow: 'Unidade II · na cadeira', titulo: 'Vetores em Rⁿ e transformações matriciais.',
      corpo: 'Na ementa: norma, produto escalar, ortogonalidade e transformações de Rⁿ em Rᵐ (02.01 a 02.06).', zoom: 0.78 },
    { eyebrow: 'Unidade II · na prática', titulo: 'Todo quadro de um jogo é uma multiplicação.',
      corpo: 'Girar um personagem, aproximar a câmera, animar um braço de robô: cada ponto da cena passa por uma matriz.', zoom: 0.9 },
    { eyebrow: 'Unidade II · mexa você', titulo: 'Gire, estique e incline a nave.',
      corpo: 'Os três controles montam uma única matriz 2×2. É ela que move a grade e a nave juntas.', zoom: 1 },
  ],
  6: [
    { zoom: 1 },
    { eyebrow: 'Unidade III · na cadeira', titulo: 'Autovalores, autovetores e diagonalização.',
      corpo: 'Na ementa: dependência linear, base, autovalores, autovetores e diagonalização de operadores (03.01 a 03.04).', zoom: 0.78 },
    { eyebrow: 'Unidade III · na prática', titulo: 'O ranking de uma busca é um autovetor.',
      corpo: 'O PageRank repete a mesma multiplicação até a importância de cada página parar de mudar. Esse equilíbrio é o autovetor de autovalor 1.', zoom: 0.9 },
    { eyebrow: 'Unidade III · mexa você', titulo: 'Dê um link a uma página e mude o ranking.',
      corpo: 'Toque em uma página: ela ganha um link, a importância se redistribui e o equilíbrio muda.', zoom: 1 },
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

// ---------- Estação 4: sistema linear das três notas ----------
// Mesmos números da demo "sistemas-gauss" (dist/lab/sistemas-autovalores.js).
const NOTAS = [[1, 2, 1], [2, 1, 1], [1, 1, 2]];
const PRECOS = [4, 6, 10];
const TOTAIS = NOTAS.map(r => r[0] * PRECOS[0] + r[1] * PRECOS[1] + r[2] * PRECOS[2]); // 26, 28, 30
const TOTAL_REPETIDO = 34; // nota 3 vira cópia da nota 1 com outro total: planos paralelos

const det3 = m =>
  m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
  m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
  m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);

function sistemaAtual(repetida) {
  const A = NOTAS.map(r => r.slice());
  const b = TOTAIS.slice();
  if (repetida) { A[2] = A[0].slice(); b[2] = TOTAL_REPETIDO; }
  return { A, b, det: det3(A) };
}

function cramer({ A, b, det }) {
  return [0, 1, 2].map(k => det3(A.map((r, i) => r.map((v, j) => (j === k ? b[i] : v)))) / det);
}

const sistema = { repetida: false, transicao: 1, inicioTransicao: 0 };

function termo(c, letra, primeiro) {
  const sinal = primeiro ? '' : ' + ';
  return sinal + (c === 1 ? '' : c) + letra;
}

function atualizarLeituraSistema() {
  const s = sistemaAtual(sistema.repetida);
  const cores = ['var(--cyan)', 'var(--blue)', 'var(--violet)'];
  $('#equacoes').innerHTML = s.A.map((r, i) =>
    `<li class="${sistema.repetida && i === 2 ? 'mudou' : ''}"><i style="background:${cores[i]}"></i>nota ${i + 1} · ` +
    `${termo(r[0], 'x', true)}${termo(r[1], 'y')}${termo(r[2], 'z')} = ${s.b[i]}</li>`).join('') +
    '<li>x café · y pão · z sanduíche</li>';
  const leitura = $('#leitura-sistema');
  if (Math.abs(s.det) > 1e-9) {
    const [x, y, z] = cramer(s);
    leitura.innerHTML = `<span class="ok">det ≠ 0</span> → café R$ ${fmt(x, 0)}, pão R$ ${fmt(y, 0)}, sanduíche R$ ${fmt(z, 0)}`;
  } else {
    leitura.innerHTML = '<span class="falta">det = 0</span> → falta informação';
  }
  $('#repetir-nota').disabled = sistema.repetida;
  $('#voltar-nota').disabled = !sistema.repetida;
}

function mudarSistema(repetida) {
  if (sistema.repetida === repetida) return;
  sistema.repetida = repetida;
  sistema.transicao = movimentoReduzido.matches ? 1 : 0;
  sistema.inicioTransicao = performance.now();
  atualizarLeituraSistema();
  pedirQuadro();
}

// ---------- Estação 5: matriz de transformação 2×2 ----------
const transf = { alvo: [1, 0, 0, 1], atual: [1, 0, 0, 1] };

function matrizDosControles() {
  const ang = +$('#girar').value * Math.PI / 180;
  const s = +$('#esticar').value;
  const k = +$('#inclinar').value;
  // M = Rotação(θ) · Esticar(s, 1) · Inclinar(k)  →  R · [[s, s·k], [0, 1]]
  const c = Math.cos(ang), n = Math.sin(ang);
  return [c * s, c * s * k - n, n * s, n * s * k + c]; // [a, b, c, d] por linhas
}

function atualizarLeituraMatriz() {
  $('#girar-v').textContent = `${$('#girar').value}°`;
  $('#esticar-v').textContent = `${(+$('#esticar').value).toFixed(1)}×`;
  $('#inclinar-v').textContent = fmt(+$('#inclinar').value, 1);
  const m = matrizDosControles();
  transf.alvo = m;
  if (movimentoReduzido.matches) transf.atual = m.slice();
  $('#matriz').innerHTML =
    `<span class="c1">${fmt(m[0])}</span><span class="c2">${fmt(m[1])}</span>` +
    `<span class="c1">${fmt(m[2])}</span><span class="c2">${fmt(m[3])}</span>`;
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
    sistema.transicao = 1;
    transf.atual = transf.alvo.slice();
    if (!rank.estavel) { convergirRank(); atualizarLeituraRank(); }
  }
  // Câmera: lerp até o progresso da rolagem (salto direto com movimento reduzido)
  if (movimentoReduzido.matches) estado.atual = estado.alvo;
  else {
    const dif = estado.alvo - estado.atual;
    if (Math.abs(dif) > 1e-5) { estado.atual += dif * 0.12; ocupado = true; } else estado.atual = estado.alvo;
  }
  // Estação 4: transição dos planos
  if (sistema.transicao < 1) {
    sistema.transicao = limitar((agora - sistema.inicioTransicao) / 700, 0, 1);
    ocupado = true;
  }
  // Estação 5: matriz exibida persegue a matriz dos controles
  for (let k = 0; k < 4; k++) {
    const d = transf.alvo[k] - transf.atual[k];
    if (Math.abs(d) > 1e-4) { transf.atual[k] += d * 0.18; ocupado = true; } else transf.atual[k] = transf.alvo[k];
  }
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

  // ---------- 4 · Unidade I: três planos, um ponto ----------
  const estacao4 = (() => {
    const e = novaEstacao(4, 3.6);
    const conjunto = new THREE.Group();
    conjunto.rotation.set(0.42, -0.62, 0);
    e.grupo.add(conjunto);
    e.girar = conjunto;
    e.base = { x: 0.42, y: -0.62 };
    const ESCALA = 3; // 3 reais de preço = 1 unidade da cena; centro da cena = solução (4, 6, 10)
    const LADO = 4.6;
    const cores = [COR.ciano, COR.azul, COR.violeta];
    const planos = cores.map(cor => {
      const g = new THREE.Group();
      const malha = new THREE.Mesh(new THREE.PlaneGeometry(LADO, LADO), matBasico(cor, { transparent: true, opacity: 0.16, depthWrite: false }));
      const borda = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(LADO, LADO)), matLinha(cor, { transparent: true, opacity: 0.85 }));
      g.add(malha, borda);
      conjunto.add(g);
      return g;
    });
    // retas de interseção de cada par de planos
    const retas = [0, 1, 2].map(() => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      const l = new THREE.Line(geo, matLinha(COR.texto, { transparent: true, opacity: 0.55 }));
      conjunto.add(l);
      return l;
    });
    const ponto = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 14), matBasico(0xffffff, { transparent: true }));
    const halo = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 14), matBasico(COR.ciano, { transparent: true, opacity: 0.25, depthWrite: false }));
    conjunto.add(ponto, halo);

    const Z = new THREE.Vector3(0, 0, 1);
    const centro = new THREE.Vector3(...PRECOS);
    // plano a·v = d (preços) → em coordenadas da cena: n·u = h, com u = (v − centro) / ESCALA
    function planoCena(a, d) {
      const v = new THREE.Vector3(...a);
      const len = v.length();
      return { n: v.clone().divideScalar(len), h: (d - v.dot(centro)) / (ESCALA * len) };
    }
    function equacoes() {
      const ini = sistemaAtual(!sistema.repetida), fim = sistemaAtual(sistema.repetida);
      const t = suave(sistema.transicao);
      return fim.A.map((r, i) => planoCena(r.map((v, j) => lerp(ini.A[i][j], v, t)), lerp(ini.b[i], fim.b[i], t)));
    }
    function interseccao(p1, p2) {
      const dir = new THREE.Vector3().crossVectors(p1.n, p2.n);
      if (dir.lengthSq() < 1e-6) return null;
      const n11 = 1, n22 = 1, n12 = p1.n.dot(p2.n), den = n11 * n22 - n12 * n12;
      const a = (p1.h * n22 - p2.h * n12) / den, b = (p2.h * n11 - p1.h * n12) / den;
      return { p: p1.n.clone().multiplyScalar(a).add(p2.n.clone().multiplyScalar(b)), dir: dir.normalize() };
    }
    e.atualizar = (agora, final) => {
      const eqs = equacoes();
      eqs.forEach((q, i) => {
        planos[i].quaternion.setFromUnitVectors(Z, q.n);
        planos[i].position.copy(q.n).multiplyScalar(q.h);
      });
      [[0, 1], [1, 2], [0, 2]].forEach(([a, b], k) => {
        const it = interseccao(eqs[a], eqs[b]);
        retas[k].visible = !!it;
        if (!it) return;
        const pa = it.p.clone().addScaledVector(it.dir, -2.4), pb = it.p.clone().addScaledVector(it.dir, 2.4);
        retas[k].geometry.attributes.position.array.set([pa.x, pa.y, pa.z, pb.x, pb.y, pb.z]);
        retas[k].geometry.attributes.position.needsUpdate = true;
      });
      // o ponto brilha só quando existe solução única (det ≠ 0)
      const vis = sistema.repetida ? 1 - suave(sistema.transicao) : suave(sistema.transicao);
      ponto.material.opacity = vis; halo.material.opacity = 0.25 * vis;
      const pulso = final || movimentoReduzido.matches ? 1 : 1 + 0.12 * Math.sin(agora / 380);
      halo.scale.setScalar(pulso);
      ponto.visible = halo.visible = vis > 0.01;
      return false;
    };
    return e;
  })();

  // ---------- 5 · Unidade II: grade + nave sob uma matriz ----------
  {
    const e = novaEstacao(5, 3.4);
    const conjunto = new THREE.Group();
    conjunto.rotation.set(-0.5, 0.32, 0);
    e.grupo.add(conjunto);
    e.girar = conjunto;
    e.base = { x: -0.5, y: 0.32 };
    const L = 2.5, D = 0.5;
    const segmentos = [];
    for (let v = -L; v <= L + 1e-6; v += D) { segmentos.push([[v, -L], [v, L]], [[-L, v], [L, v]]); }
    // grade original, tracejada ao fundo
    const geoOrig = new THREE.BufferGeometry().setFromPoints(segmentos.flat().map(([x, y]) => new THREE.Vector3(x, y, -0.35)));
    const orig = new THREE.LineSegments(geoOrig, new THREE.LineDashedMaterial({ color: COR.aux, dashSize: 0.08, gapSize: 0.1, transparent: true, opacity: 0.45 }));
    orig.computeLineDistances();
    conjunto.add(orig);
    // grade transformada
    const geoGrade = new THREE.BufferGeometry();
    geoGrade.setAttribute('position', new THREE.BufferAttribute(new Float32Array(segmentos.length * 6), 3));
    const grade = new THREE.LineSegments(geoGrade, matLinha(COR.aux, { transparent: true, opacity: 0.5 }));
    conjunto.add(grade);
    // colunas da matriz: para onde vão (1, 0) e (0, 1)
    const geoEixos = new THREE.BufferGeometry();
    geoEixos.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3));
    geoEixos.setAttribute('color', new THREE.BufferAttribute(new Float32Array([
      ...new THREE.Color(COR.ciano).toArray(), ...new THREE.Color(COR.ciano).toArray(),
      ...new THREE.Color(COR.azul).toArray(), ...new THREE.Color(COR.azul).toArray()]), 3));
    const eixos = new THREE.LineSegments(geoEixos, new THREE.LineBasicMaterial({ vertexColors: true }));
    conjunto.add(eixos);
    // nave em wireframe (x, y no plano; z para dar volume)
    const V = [[0, 1.4, 0.05], [-1.05, -0.95, 0.05], [0, -0.5, 0.05], [1.05, -0.95, 0.05], [0, -0.25, 0.55]];
    const A = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 0], [4, 1], [4, 2], [4, 3]];
    const geoNave = new THREE.BufferGeometry();
    geoNave.setAttribute('position', new THREE.BufferAttribute(new Float32Array(A.length * 6), 3));
    const nave = new THREE.LineSegments(geoNave, matLinha(COR.texto));
    conjunto.add(nave);
    const aplicar = (m, x, y) => [m[0] * x + m[1] * y, m[2] * x + m[3] * y];
    e.atualizar = () => {
      const m = transf.atual;
      const pg = geoGrade.attributes.position.array;
      segmentos.forEach(([a, b], k) => {
        const [ax, ay] = aplicar(m, ...a), [bx, by] = aplicar(m, ...b);
        pg.set([ax, ay, 0, bx, by, 0], k * 6);
      });
      geoGrade.attributes.position.needsUpdate = true;
      geoEixos.attributes.position.array.set([0, 0, 0.02, m[0], m[2], 0.02, 0, 0, 0.02, m[1], m[3], 0.02]);
      geoEixos.attributes.position.needsUpdate = true;
      const pn = geoNave.attributes.position.array;
      A.forEach(([i, j], k) => {
        const [ax, ay] = aplicar(m, V[i][0], V[i][1]), [bx, by] = aplicar(m, V[j][0], V[j][1]);
        pn.set([ax, ay, V[i][2], bx, by, V[j][2]], k * 6);
      });
      geoNave.attributes.position.needsUpdate = true;
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
  return { desenhar, medir, estacao4, estacao6, iniciarIntro: () => { estacoes[0].introInicio = performance.now(); } };
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
  atualizarLeituraSistema();
  atualizarLeituraMatriz();
  ['#girar', '#esticar', '#inclinar'].forEach(s => $(s).addEventListener('input', atualizarLeituraMatriz));
  $('#repetir-nota').addEventListener('click', () => mudarSistema(true));
  $('#voltar-nota').addEventListener('click', () => mudarSistema(false));
  $('#recomecar').addEventListener('click', reiniciarRank);
  transf.atual = transf.alvo.slice();
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
