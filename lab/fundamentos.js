/* Nine interactive simulations; JavaScript reproduces the listed NumPy operations. */
(() => {
  'use strict';
  const LAB = window.AlgebraLab;
  const C = { ink: 'var(--foreground)', border: 'var(--border)', bg: 'var(--background)', muted: 'var(--muted)', soft: 'var(--muted-foreground)', a: 'var(--viz-series-1)', b: 'var(--viz-series-2)', c: 'var(--viz-series-3)' };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const fixed = (x, n = 2) => Number(x).toFixed(n).replace('.', ',');
  const norm = a => Math.hypot(...a);
  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
  const matvec = (m, v) => m.map(r => dot(r, v));
  const ease = t => t * t * (3 - 2 * t);
  const np = path => ({ label: 'Documentação NumPy', url: 'https://numpy.org/doc/stable/' + path });
  const code = s => `<p style="margin:0 0 8px"><span class="muted">&gt;&gt;&gt;</span> ${s}</p>`;
  const flex = parts => `<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">${parts.join('')}</div>`;
  function title(api, svg, text) { svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', text); api.el('title', {}, svg, text); }
  function text(api, svg, x, y, value, anchor = 'middle', extra = {}) { return api.el('text', { x, y, fill: C.ink, 'font-size': 14, 'text-anchor': anchor, ...extra }, svg, value); }
  function line(api, svg, x1, y1, x2, y2, color = C.border, width = 1, extra = {}) { return api.el('line', { x1, y1, x2, y2, stroke: color, 'stroke-width': width, ...extra }, svg); }
  function arrow(api, svg, x1, y1, x2, y2, color = C.a, width = 3) {
    line(api, svg, x1, y1, x2, y2, color, width);
    const angle = Math.atan2(y2 - y1, x2 - x1), size = 10;
    api.el('path', { d: `M${x2 - size * Math.cos(angle - .45)},${y2 - size * Math.sin(angle - .45)} L${x2},${y2} L${x2 - size * Math.cos(angle + .45)},${y2 - size * Math.sin(angle + .45)}`, fill: 'none', stroke: color, 'stroke-width': width }, svg);
  }
  function circle(api, svg, x, y, r, fill, extra = {}) { return api.el('circle', { cx: x, cy: y, r, fill, ...extra }, svg); }
  function finish(api, draw) { api.onResize(draw); draw(); }

  LAB.register({
    id: 'numpy-imagem', topic: 'NumPy', title: 'Realçar as cores de uma imagem',
    application: 'Ao realçar uma imagem, o editor aumenta a intensidade da cor em todos os pixels juntos.',
    connection: 'NumPy → a mesma conta aplicada à imagem inteira.',
    source: np('reference/generated/numpy.clip.html'),
    mount(api) {
      let gain = 1.35;
      // Synthetic pixel-art image data: a heart with three intensity levels.
      const imageRows = ['0000000000','0011001100','0133112210','1233322221','1222222221','0122222210','0012222100','0001221000','0000110000','0000000000'];
      const levels = [0,70,140,210];
      const pixels = imageRows.flatMap(row => [...row].map(value => levels[Number(value)]));
      const sample = pixels.slice(31, 36);
      function draw() {
        const { svg, w, h } = api.svg(); title(api, svg, 'Imagem de intensidades antes e depois de multiplicar todos os pixels por um ganho.');
        const size = Math.min((w - 42) / 2, h - 110, 260), y = (h - size) / 2 - 6, left = (w - size * 2 - 22) / 2;
        [1, gain].forEach((g, panel) => {
          const x = left + panel * (size + 22);
          text(api, svg, x + size / 2, y - 14, panel ? `Depois · × ${fixed(gain)}` : 'Antes');
          pixels.forEach((v, i) => {
            const row = Math.floor(i / 10);
            api.el('rect', { x: x + i % 10 * size / 10, y: y + row * size / 10, width: size / 10 - .6, height: size / 10 - .6, fill: C.a, opacity: clamp(v * g, 0, 255) / 255 }, svg);
          });
          api.el('rect', { x: x + size / 10 - 1, y: y + 3 * size / 10 - 1, width: size / 2 + 2, height: size / 10 + 2, fill: 'none', stroke: C.ink, 'stroke-width': 1.5 }, svg);
        });
        text(api, svg, w / 2, Math.min(h - 14, y + size + 34), 'A linha marcada aparece em números ao lado');
        const after = sample.map(v => Math.round(clamp(v * gain, 0, 255)));
        api.math('a mesma conta em todos os pixels', code(`nova = np.clip(img * ${fixed(gain)}, 0, 255)`) +
          api.matrix([sample, after], { rowLabels: ['antes', 'depois'], mark: (i, j) => i && after[j] === 255 ? 'on' : '' }) +
          `<p class="muted">Uma linha de código muda os ${pixels.length} pixels. 255 é o máximo: quem chega lá perde detalhe.</p>`);
      }
      function status() { const saturated=pixels.filter(v => v * gain >= 255).length; api.status(saturated ? `${saturated} pixels chegaram ao máximo: aumentar demais apaga diferenças entre eles.` : 'Todos os pixels mudam juntos. A imagem continua com a mesma forma.'); }
      api.range('Intensidade da cor (%)', 20, 300, 5, Math.round(gain*100), v => { gain = +v/100; draw(); status(); });
      finish(api, draw); status();
    }
  });

  LAB.register({
    id: 'numpy-lote', topic: 'NumPy', title: 'Mover vários personagens juntos',
    application: 'Uma rajada de vento empurra todos os personagens de um jogo na mesma direção.',
    connection: 'NumPy → somar o mesmo deslocamento a várias posições.',
    source: np('user/basics.broadcasting.html'),
    mount(api) {
      let dx = 2, dy = 0, phase = 0;
      const points = [[-3,-2],[-2,2],[-1,0],[1,-2],[1,2],[3,0]];
      function draw() {
        const { svg, w, h } = api.svg(); title(api, svg, 'Seis personagens recebem ao mesmo tempo o mesmo deslocamento.');
        const scale = Math.min((w - 40) / 11, (h - 100) / 8), cx = w / 2 - dx * scale / 2, cy = h / 2 + 6 + dy * scale / 2;
        text(api, svg, w / 2, 26, 'Uma rajada · seis personagens');
        points.forEach(([x, y], i) => {
          const sx = cx + x * scale, sy = cy - y * scale, ex = sx + dx * scale * phase, ey = sy - dy * scale * phase;
          circle(api, svg, sx, sy, 13, 'none', { stroke: C.soft, 'stroke-width': 1.5, 'stroke-dasharray': '3 3' });
          if (phase > .05) arrow(api, svg, sx, sy, ex - (dx ? Math.sign(dx) * 14 : 0), ey + (dy ? 14 : 0), C.a, 1.5);
          circle(api, svg, ex, ey, 13, C.a);
          text(api, svg, ex, ey + 5, String(i + 1), 'middle', { fill: C.bg });
        });
        text(api, svg, w / 2, h - 16, 'Tracejado = onde estavam · cheio = onde estão');
        const rows = points.map(([x, y]) => [x + dx * phase, y + dy * phase].map(v => fixed(Math.round(v * 10) / 10 || 0, 1)));
        api.math('soma em todas as linhas', code(`P = P + [${dx}, ${dy}]`) +
          flex([api.matrix(points, { colLabels: ['x', 'y'] }), '<span>+</span>', api.matrix([[dx, dy]]), '<span>=</span>', api.matrix(rows, { colLabels: ['x′', 'y′'], mark: () => phase === 1 ? 'on' : '' })]) +
          '<p class="muted">Cada linha é um personagem. O mesmo vetor é somado a todas.</p>');
      }
      api.select('Direção do vento',[{value:'direita',label:'Para a direita'},{value:'esquerda',label:'Para a esquerda'},{value:'cima',label:'Para cima'}],'direita',v=>{dx=v==='direita'?2:v==='esquerda'?-2:0;dy=v==='cima'?2:0;play();});
      function play() { api.loop(1200, p => { phase = ease(p); draw(); }); }
      api.onResize(draw); api.status('Uma única soma desloca os seis personagens pela mesma distância, na mesma direção.'); play();
    }
  });

  LAB.register({
    id: 'numpy-normalizacao', topic: 'NumPy', title: 'Comparar sensores diferentes',
    application: 'Uma estufa acompanha temperatura e umidade, duas medidas que usam unidades diferentes.',
    connection: 'NumPy → ajustar colunas de dados para uma escala comum.',
    source: np('user/basics.broadcasting.html'),
    mount(api) {
      let phase = 0;
      const rows = [[18,30],[22,45],[24,60],[28,65]], mins=[18,30], maxs=[28,65];
      function draw() {
        const normalized = phase > .5;
        const { svg, w, h } = api.svg(); title(api, svg, 'Temperatura e umidade antes e depois de converter a menor leitura em zero e a maior em cem por cento.');
        const narrow=w<420,left = 92, right = w - 58, y0 = narrow?96:78, rowH = Math.min(64, (h - y0 - 50) / 4), span = right - left;
        text(api, svg, w / 2, 26, normalized ? 'Depois: posição na faixa de cada sensor' : 'Antes: graus e porcentagens');
        [0,1].forEach((j) => { const x=narrow?left:left+j*span/2,y=narrow?40+j*22:42;api.el('rect', { x, y, width: 10, height: 10, fill: j ? C.b : C.a }, svg); text(api, svg, x+16, y+10, j ? 'Umidade' : 'Temperatura', 'start'); });
        rows.forEach((row, i) => {
          const yy = y0 + i * rowH;
          text(api, svg, 12, yy + 16, `Leitura ${i + 1}`, 'start');
          [0,1].forEach(j => {
            const value = row[j], relative = (value-mins[j])/(maxs[j]-mins[j]);
            const end = left + span * (value / 100 * (1-phase) + relative * phase), y = yy + j * 22;
            api.el('rect', { x: left, y, width: Math.max(2, end - left), height: 14, rx: 2, fill: j ? C.b : C.a }, svg);
            text(api, svg, end+6, y + 12, normalized ? `${Math.round(relative*100)}%` : `${value}${j ? '%' : '°'}`, 'start');
          });
        });
        const shown = rows.map(r => r.map((v, j) => normalized ? `${Math.round((v-mins[j])/(maxs[j]-mins[j])*100)}%` : `${v}${j ? '%' : '°'}`));
        api.math('mesma escala para colunas diferentes', code('(x - x.min()) / (x.max() - x.min())') +
          api.matrix(shown, { colLabels: ['temp.', 'umid.'], mark: () => normalized ? 'on' : '' }) +
          '<p class="muted">Cada coluna vira 0% (menor leitura) a 100% (maior). A conta vale para a tabela toda de uma vez.</p>');
      }
      api.onResize(draw);
      api.status('Graus e porcentagem não se comparam. Na mesma escala, dá para ver qual medida variou mais em cada leitura.');
      api.loop(1400, p => { phase = ease(p); draw(); }, { yoyo: true });
    }
  });

  LAB.register({
    id: 'vetores-movimento', topic: 'Vetores e matrizes', title: 'Direção e velocidade em um jogo',
    application: 'Ao mover o controle de um jogo, você escolhe para onde e quão rápido o personagem anda.',
    connection: 'Vetores → direção e velocidade do personagem.',
    source: np('reference/generated/numpy.linalg.norm.html'),
    mount(api) {
      let speed=3,angle=30,vx,vy,p=0;
      function draw() {
        const { svg, w, h } = api.svg(); title(api, svg, 'Personagem se move a partir da origem conforme as componentes de um vetor.');
        const s = Math.min((w - 40) / 10, (h - 70) / 10), cx = w / 2, cy = h / 2 + 4;
        for (let i = -5; i <= 5; i++) { line(api, svg, cx - 5 * s, cy + i * s, cx + 5 * s, cy + i * s); line(api, svg, cx + i * s, cy - 5 * s, cx + i * s, cy + 5 * s); }
        const x = cx + vx * s, y = cy - vy * s;
        if (Math.abs(vx) > .01 && Math.abs(vy) > .01) { line(api, svg, cx, cy, x, cy, C.b, 2, { 'stroke-dasharray': '4 4' }); line(api, svg, x, cy, x, y, C.c, 2, { 'stroke-dasharray': '4 4' }); }
        arrow(api, svg, cx, cy, x, y);
        circle(api, svg, cx, cy, 6, C.bg, { stroke: C.soft });
        circle(api, svg, cx + vx * s * p, cy - vy * s * p, 13, C.b, { stroke: C.bg, 'stroke-width': 3 });
        text(api, svg, w / 2, 24, 'A seta é o vetor velocidade');
        text(api, svg, w / 2, h - 12, `Tempo: ${fixed(p, 1)} s`);
        const pos = [vx * p, vy * p];
        api.math('vetor velocidade', flex(['<span>v =</span>', api.matrix([[fixed(vx, 1)], [fixed(vy, 1)]], { mark: (i) => i ? '' : '' })]) +
          `<p>‖v‖ = <span class="hot">${speed}</span> passos/s</p>` +
          `<p>posição = t · v = (${fixed(pos[0], 1)}; ${fixed(pos[1], 1)})</p>` +
          '<p class="muted">O tamanho da seta é a velocidade. Tracejados: quanto anda em x e em y.</p>');
      }
      function update() { vx=speed*Math.cos(angle*Math.PI/180);vy=speed*Math.sin(angle*Math.PI/180); api.loop(1000,t=>{p=t;draw();}); }
      api.select('Direção',[{value:'30',label:'Diagonal'},{value:'0',label:'Direita'},{value:'90',label:'Cima'},{value:'180',label:'Esquerda'}],'30',v=>{angle=+v;update();});
      api.range('Velocidade (passos/s)',1,4,1,speed,v=>{speed=+v;update();});
      api.onResize(draw); api.status('Uma seta maior faz o personagem percorrer mais espaço no mesmo tempo.'); update();
    }
  });

  LAB.register({
    id: 'matrizes-pixels', topic: 'Vetores e matrizes', title: 'Desenhar com pixels',
    application: 'Um desenho digital é formado por pequenos quadrados que podem ser alterados separadamente.',
    connection: 'Matrizes → linhas e colunas de pixels formam uma imagem.',
    source: np('user/basics.indexing.html'),
    mount(api) {
      const values = [[0,90,90,90,90,0],[90,255,90,90,255,90],[90,90,90,90,90,90],[90,255,90,90,255,90],[90,90,255,255,90,90],[0,90,90,90,90,0]];
      const n = values.length;
      let row = 1, col = 1, scan = n * n;
      function draw() {
        const { svg, w, h } = api.svg(); title(api, svg, 'Matriz seis por seis desenhada pixel a pixel, linha por linha.');
        const size = Math.min(w - 60, h - 80, 300), cell = size / n, ox = (w - size) / 2, oy = (h - size) / 2 + 4;
        const current = Math.min(n * n - 1, scan);
        text(api, svg, w / 2, 24, scan < n * n ? `Lendo linha ${Math.floor(current / n) + 1}, coluna ${current % n + 1}` : 'Imagem pronta');
        values.forEach((r, y) => r.forEach((v, x) => {
          const index = y * n + x, shown = index <= scan;
          api.el('rect', { x: ox + x * cell + 2, y: oy + y * cell + 2, width: cell - 4, height: cell - 4, rx: 3, fill: shown ? C.a : C.border, opacity: shown ? .06 + v / 255 * .9 : .35 }, svg);
          if (index === current && scan < n * n) api.el('rect', { x: ox + x * cell, y: oy + y * cell, width: cell, height: cell, rx: 4, fill: 'none', stroke: C.a, 'stroke-width': 3 }, svg);
          if (x === col && y === row) api.el('rect', { x: ox + x * cell + 1, y: oy + y * cell + 1, width: cell - 2, height: cell - 2, rx: 3, fill: 'none', stroke: C.ink, 'stroke-width': 2, 'stroke-dasharray': '4 3' }, svg);
        }));
        text(api, svg, w / 2, h - 12, `${n} linhas · ${n} colunas · ${n * n} números`);
        api.math('a imagem é uma matriz', api.matrix(values.map(r => r.map(Math.round)), { digits: 0, mark: (i, j) => i * n + j === current && scan < n * n ? 'on' : i === row && j === col ? 'row' : '' }) +
          `<p>img[${row}, ${col}] = <span class="hot">${Math.round(values[row][col])}</span></p>` +
          `<p class="muted">0 = apagado · 255 = brilho máximo. Tracejado: o pixel escolhido. O Python conta a partir do 0: linha ${row + 1}, coluna ${col + 1} vira img[${row}, ${col}].</p>`);
      }
      function status() { api.status('A tela lê a matriz linha por linha: cada número vira o brilho de um quadrado.'); }
      const options = Array.from({ length: n * n }, (_, i) => ({ value: String(i), label: `Linha ${Math.floor(i/n)+1}, coluna ${i%n+1}` }));
      api.select('Escolha um pixel', options, String(row * n + col), v => { row = Math.floor(+v/n); col = +v%n; draw(); });
      api.button('Acender / apagar pixel', () => { values[row][col] = values[row][col] > 128 ? 0 : 255; draw(); }, { primary: true });
      api.onResize(draw); status();
      api.loop(3200, p => { scan = Math.floor(p * n * n); draw(); });
    }
  });

  LAB.register({
    id: 'vetores-perfis', topic: 'Vetores e matrizes', title: 'Um jogo combina com você?',
    application: 'Uma loja de jogos compara seus gostos com as características de cada jogo.',
    connection: 'Vetores → uma lista de números representa seus gostos.',
    source: np('reference/generated/numpy.linalg.norm.html'),
    mount(api) {
      const target = [8,3,6], labels = ['Ação', 'Estratégia', 'Exploração']; let profile = [4,7,5];
      function draw() {
        const { svg, w, h } = api.svg(); title(api, svg, 'Três atributos numéricos formam vetores de perfil e de um jogo; barras mostram diferenças.');
        const left = 20, right = w - 40, span = right - left, rowH = Math.min(100, (h - 90) / 3);
        const narrow = w < 420; text(api, svg, left, 26, narrow ? '■ Jogo · em cima' : '■ Jogo “Nebulosa” · em cima', 'start', { fill: C.b }); text(api, svg, right, 26, narrow ? '■ Você · embaixo' : '■ Seu perfil · embaixo', 'end', { fill: C.a });
        profile.forEach((v, i) => {
          const y = 66 + i * rowH;
          text(api, svg, left, y - 10, labels[i], 'start');
          api.el('rect', { x: left, y, width: span, height: 16, rx: 3, fill: C.muted, opacity: .25 }, svg);
          api.el('rect', { x: left, y, width: span * target[i] / 10, height: 16, rx: 3, fill: C.b, opacity: .7 }, svg);
          api.el('rect', { x: left, y: y + 22, width: span, height: 16, rx: 3, fill: C.muted, opacity: .25 }, svg);
          api.el('rect', { x: left, y: y + 22, width: span * v / 10, height: 16, rx: 3, fill: C.a }, svg);
          const a = left + span * Math.min(v, target[i]) / 10, b = left + span * Math.max(v, target[i]) / 10;
          if (b - a > 2) api.el('rect', { x: a, y: y - 2, width: b - a, height: 42, fill: C.ink, opacity: .08 }, svg);
          text(api, svg, right + 8, y + 13, String(target[i]), 'start'); text(api, svg, right + 8, y + 35, String(Math.round(v)), 'start');
        });
        text(api, svg, w / 2, h - 14, 'Faixa clara = diferença entre os gostos');
        const diff = profile.map((v, i) => v - target[i]), distance = norm(diff);
        api.math('distância entre vetores', flex([api.matrix([profile.map(Math.round)], {}), '<span>−</span>', api.matrix([target])]) +
          `<p>= (${diff.map(v => fixed(v, 0)).join('; ')})</p><p>‖p − j‖ = <span class="hot">${fixed(distance, 1)}</span></p>` +
          '<p class="muted">Quanto menor a distância, mais o jogo combina com você.</p>');
      }
      function status() { const distance=norm(profile.map((v,i)=>v-target[i]));api.status(distance<1?'Distância zero: seu perfil coincide com o deste jogo.':'As diferenças entre as barras viram uma única distância: quanto menor, melhor a indicação.'); }
      api.select('Seu estilo',[{value:'estrategia',label:'Gosto de estratégia'},{value:'acao',label:'Gosto de ação'},{value:'explorar',label:'Gosto de explorar'}],'estrategia',v=>{const from=profile.slice(),to=v==='acao'?[8,3,6]:v==='explorar'?[3,4,9]:[4,7,5];api.animate(650,p=>{profile=from.map((x,i)=>x+(to[i]-x)*ease(p));draw();},status);});
      finish(api, draw); status();
    }
  });

  LAB.register({
    id: 'operacoes-iluminacao', topic: 'Operações vetoriais e matriciais', title: 'De que lado vem a luz?',
    application: 'Em um jogo 3D, uma superfície recebe mais luz quando está voltada para a fonte.',
    connection: 'Produto escalar → quanto de luz uma superfície recebe.',
    source: { label: 'MDN · iluminação em WebGL', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Lighting_in_WebGL' },
    mount(api) {
      let angle = 35;
      function draw() {
        const { svg, w, h } = api.svg(); title(api, svg, 'Produto escalar determina intensidade da luz difusa em uma superfície plana.');
        const cx = w / 2, cy = h * .5, radius = Math.min(w * .3, h * .3), rad = angle * Math.PI / 180, intensity = Math.max(0, Math.cos(rad));
        api.el('ellipse', { cx, cy: cy + 14, rx: radius, ry: 30, fill: C.a, opacity: .06 + intensity * .8 }, svg);
        arrow(api, svg, cx, cy, cx, cy - radius, C.b, 2);
        const lx = cx + Math.sin(rad) * radius, ly = cy - Math.cos(rad) * radius;
        arrow(api, svg, cx, cy, lx, ly, C.a, 3);
        circle(api, svg, lx, ly, 11, C.a);
        text(api, svg, cx - 10, cy - radius + 4, 'n (frente)', 'end', { fill: C.b });
        text(api, svg, clamp(lx + (lx >= cx ? 18 : -18), 50, w - 50), ly + (ly > cy ? 26 : -12), 'l (luz)', lx >= cx ? 'start' : 'end');
        text(api, svg, w / 2, 26, `Luz recebida: ${Math.round(intensity * 100)}%`);
        const bx = 30, by = h - 34, bw = w - 60;
        api.el('rect', { x: bx, y: by, width: bw, height: 12, rx: 3, fill: C.muted, opacity: .3 }, svg);
        api.el('rect', { x: bx, y: by, width: bw * intensity, height: 12, rx: 3, fill: C.a }, svg);
        const l = [Math.sin(rad), Math.cos(rad)];
        api.math('produto escalar', `<p style="margin:0">n = (0; 1)</p><p style="margin:0">l = (${fixed(l[0])}; ${fixed(l[1])})</p>` +
          `<p>n · l = 0·${fixed(l[0])} + 1·${fixed(l[1])} = <span class="hot">${fixed(l[1])}</span></p>` +
          `<p>luz = máx(0; n·l) = <span class="hot">${Math.round(intensity * 100)}%</span></p><p class="muted">Negativo = luz por trás → face escura.</p>`);
      }
      function status() { api.status(Math.abs(angle)>90?'A luz está atrás: o produto escalar fica negativo e esta face não recebe luz direta.':'Quanto mais de lado vem a luz, menor o produto escalar e mais escura a face.'); }
      const angleInput = api.range('Posição da luz (°) · arraste para controlar', -150, 150, 5, angle, v => { api.cancel(); angle = +v; draw(); status(); });
      api.onResize(draw); status();
      api.loop(2600, p => { angle = -150 + 300 * ease(p); angleInput.value = Math.round(angle); if (angleInput.previousElementSibling) angleInput.previousElementSibling.textContent = String(Math.round(angle)); draw(); }, { yoyo: true });
    }
  });

  LAB.register({
    id: 'operacoes-recomendacao', topic: 'Operações vetoriais e matriciais', title: 'Qual jogo indicar para você?',
    application: 'Uma loja organiza suas sugestões de jogos de acordo com o que você mais gosta.',
    connection: 'Matriz × vetor → comparar vários jogos com suas preferências.',
    source: np('reference/generated/numpy.matmul.html'),
    mount(api) {
      const games = ['Órbita', 'Império', 'Horizonte'], genres=['Ação','Estratégia','Exploração'],matrix = [[9,2,5],[2,10,3],[5,4,10]]; let pref = [2,3,9];
      function draw() {
        const { svg, w, h } = api.svg(); title(api, svg, 'Matriz de atributos de três jogos multiplicada pelo vetor de preferências, resultando em três pontuações.');
        const scores = matvec(matrix,pref), maxPossible = 130, left = 20, span = w - 80;
        text(api, svg, w / 2, 26, 'Quanto cada jogo combina com seu gosto');
        const rh = Math.min(100, (h - 80) / 3), winner = scores.indexOf(Math.max(...scores));
        games.forEach((name,i) => {
          const y = 66 + i * rh;
          text(api, svg, left, y, `${name} · ${genres[i]}`, 'start', i === winner ? { fill: C.a } : {});
          api.el('rect', { x:left, y:y+10, width:span, height:20, rx:3, fill:C.muted, opacity:.25 }, svg);
          api.el('rect', { x:left, y:y+10, width:span * scores[i] / maxPossible, height:20, rx:3, fill:i === winner ? C.a : C.b, opacity:i === winner ? 1 : .55 }, svg);
          text(api, svg, left + span + 8, y + 26, String(Math.round(scores[i])), 'start');
        });
        text(api, svg, w / 2, h - 14, `Indicação: ${games[winner]}`);
        api.math('matriz × vetor', '<p class="muted" style="margin:0 0 4px">jogos × gêneros (M)</p>' + api.matrix(matrix, { rowLabels: games.map(g => g.slice(0, 3)), colLabels: ['Aç', 'Es', 'Ex'], mark: i => i === winner ? 'row' : '' }) +
          flex(['<span>p =</span>', api.matrix([pref.map(Math.round)])]) +
          flex(['<span>M · p =</span>', api.matrix([scores.map(Math.round)], { mark: (_, j) => j === winner ? 'on' : '' })]) +
          '<p class="muted">Cada nota = linha do jogo · seus gostos. Uma conta faz todas.</p>');
      }
      function status() { const scores = matvec(matrix,pref),winner=scores.indexOf(Math.max(...scores)); api.status(`${games[winner]} recebe a maior pontuação porque suas características combinam mais com a preferência escolhida.`); }
      api.select('O que você mais gosta?',[{value:'acao',label:'Ação'},{value:'estrategia',label:'Estratégia'},{value:'explorar',label:'Exploração'}],'explorar',v=>{const from=pref.slice(),to=v==='acao'?[9,2,3]:v==='estrategia'?[2,9,3]:[2,3,9];api.animate(650,p=>{pref=from.map((x,i)=>x+(to[i]-x)*ease(p));draw();},status);});
      finish(api,draw);status();
    }
  });

  LAB.register({
    id: 'operacoes-composicao', topic: 'Operações vetoriais e matriciais', title: 'Esticar e girar: a ordem importa',
    application: 'Em um editor de imagens, girar antes de esticar pode produzir uma figura diferente.',
    connection: 'Multiplicação de matrizes → combinar transformações na ordem certa.',
    source: np('reference/generated/numpy.matmul.html'),
    mount(api) {
      let angle = 35, stretch = 1.8, order = 'RS', phase = 1;
      const points = [[-.8,-.6],[.8,-.6],[.8,.6],[-.8,.6]];
      function transform([x,y], which) {
        const a = angle * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
        return which === 'RS' ? [c * stretch * x - s * y, s * stretch * x + c * y] : [stretch * (c*x-s*y), s*x+c*y];
      }
      function draw() {
        const { svg, w, h } = api.svg(); title(api, svg, 'Comparação de rotação após escala e escala após rotação em um retângulo.');
        const cx=w/2,cy=h/2+8,sc=Math.min((w-50)/4.4,(h-90)/4);
        const path = arr => arr.map(([x,y])=>`${cx+x*sc},${cy-y*sc}`).join(' ');
        api.el('polygon',{points:path(points),fill:'none',stroke:C.soft,'stroke-width':1.5,'stroke-dasharray':'4 4'},svg);
        const other = points.map(p=>transform(p,order==='RS'?'SR':'RS'));
        api.el('polygon',{points:path(other),fill:'none',stroke:C.b,'stroke-width':2,'stroke-dasharray':'6 4'},svg);
        const first = Math.min(1,phase*2), second = Math.max(0,phase*2-1);
        const result = points.map(([x,y])=>{
          if(order==='RS'){
            const sx=x*(1+(stretch-1)*first), a=angle*Math.PI/180*second;
            return [Math.cos(a)*sx-Math.sin(a)*y,Math.sin(a)*sx+Math.cos(a)*y];
          }
          const a=angle*Math.PI/180*first, rx=Math.cos(a)*x-Math.sin(a)*y, ry=Math.sin(a)*x+Math.cos(a)*y;
          return [rx*(1+(stretch-1)*second),ry];
        });
        api.el('polygon',{points:path(result),fill:C.a,'fill-opacity':.18,stroke:C.a,'stroke-width':2.5},svg);
        const point=result[2];circle(api,svg,cx+point[0]*sc,cy-point[1]*sc,6,C.a);
        const steps = order === 'RS' ? ['Esticar', 'Girar'] : ['Girar', 'Esticar'];
        text(api,svg,w/2,26,`1. ${steps[0]} → 2. ${steps[1]}${phase < .5 ? ' · passo 1' : phase < 1 ? ' · passo 2' : ''}`);
        text(api,svg,w/2,h-14,'Azul tracejado: resultado com a ordem invertida', 'middle', { fill: C.b });
        const a = angle * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
        const S = [[stretch, 0], [0, 1]], R = [[fixed(c), fixed(-s)], [fixed(s), fixed(c)]];
        const product = order === 'RS' ? [[c*stretch, -s], [s*stretch, c]] : [[stretch*c, -stretch*s], [s, c]];
        const stage = phase < .5 ? 0 : 1, names = order === 'RS' ? ['S', 'R'] : ['R', 'S'], mats = order === 'RS' ? [S, R] : [R, S];
        api.math('multiplicação de matrizes', `<p style="margin:0">Aplica primeiro <span class="hot">${names[0]}</span>, depois ${names[1]}:</p>` +
          flex([`<span${stage === 1 ? ' class="hot"' : ''}>${names[1]}</span>`, api.matrix(mats[1]), `<span>·</span><span${stage === 0 ? ' class="hot"' : ''}>${names[0]}</span>`, api.matrix(mats[0])]) +
          flex([`<span>${names[1]}·${names[0]} =</span>`, api.matrix(product.map(r => r.map(v => fixed(v))), { mark: () => phase === 1 ? 'on' : '' })]) +
          `<p class="muted">S = esticar · R = girar ${angle}°. Trocar a ordem (${names[0]}·${names[1]}) muda a matriz e a figura.</p>`);
      }
      function status(){api.status('As mesmas duas ações, em outra ordem, produzem outro formato.');}
      function play(){api.loop(2000,p=>{phase=ease(p);draw();});}
      api.select('Ordem',[{value:'RS',label:'Esticar → girar'},{value:'SR',label:'Girar → esticar'}],order,v=>{order=v;play();});
      api.onResize(draw);status();play();
    }
  });
})();
