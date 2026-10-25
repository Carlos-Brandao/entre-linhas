(function () {
  'use strict';
  const lab = window.AlgebraLab;
  const C = { ink: 'var(--foreground)', border: 'var(--border)', bg: 'var(--background)', one: 'var(--viz-series-1)', two: 'var(--viz-series-2)', three: 'var(--viz-series-3)' };
  const rad = degrees => degrees * Math.PI / 180;
  const fmt = (n, digits = 2) => Number(n).toLocaleString('pt-BR', { maximumFractionDigits: digits, minimumFractionDigits: digits });
  const lerp = (a, b, t) => a + (b - a) * t;
  const sigmoid = z => 1 / (1 + Math.exp(-z));
  let sequence = 0;
  function text(api, svg, x, y, label, attrs = {}) {
    return api.el('text', { x, y, fill: C.ink, 'font-size': 14, ...attrs }, svg, label);
  }
  function line(api, svg, a, b, attrs = {}) {
    return api.el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: C.border, 'stroke-width': 1, ...attrs }, svg);
  }
  function point(api, svg, x, y, kind, color, radius = 5) {
    if (kind === 'cross') {
      const g = api.el('g', {}, svg);
      line(api, g, [x - radius, y - radius], [x + radius, y + radius], { stroke: color, 'stroke-width': 2.2 });
      line(api, g, [x - radius, y + radius], [x + radius, y - radius], { stroke: color, 'stroke-width': 2.2 });
      return g;
    }
    if (kind === 'square') return api.el('rect', { x: x - radius, y: y - radius, width: radius * 2, height: radius * 2, fill: color }, svg);
    if (kind === 'diamond') return api.el('polygon', { points: `${x},${y - radius - 2} ${x + radius + 2},${y} ${x},${y + radius + 2} ${x - radius - 2},${y}`, fill: color }, svg);
    return api.el('circle', { cx: x, cy: y, r: radius, fill: color }, svg);
  }
  function padded(values) {
    const extent = d3.extent(values);
    const span = extent[1] - extent[0] || 1;
    return [extent[0] - span * .1, extent[1] + span * .1];
  }
  function plot(api, points, xLabel, yLabel, accessible, equalUnits = false) {
    const { svg, w, h } = api.svg();
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', accessible);
    const box = { left: 64, right: w - 18, top: 40, bottom: h - 54 };
    let xd = padded(points.map(p => p[0]));
    let yd = padded(points.map(p => p[1]));
    if (equalUnits) {
      const xr = xd[1] - xd[0], yr = yd[1] - yd[0];
      const ux = (box.right - box.left - 12) / xr;
      const uy = (box.bottom - box.top - 12) / yr;
      const units = Math.min(ux, uy);
      const xm = (xd[0] + xd[1]) / 2, ym = (yd[0] + yd[1]) / 2;
      const xhalf = (box.right - box.left - 12) / units / 2;
      const yhalf = (box.bottom - box.top - 12) / units / 2;
      xd = [xm - xhalf, xm + xhalf]; yd = [ym - yhalf, ym + yhalf];
    }
    const x = d3.scaleLinear().domain(xd).range([box.left + 6, box.right - 6]);
    const y = d3.scaleLinear().domain(yd).range([box.bottom - 6, box.top + 6]);
    api.el('rect', { x: box.left, y: box.top, width: box.right - box.left, height: box.bottom - box.top, fill: 'none', stroke: C.border, 'stroke-width': 1, 'data-chart-frame': '' }, svg);
    const xa = api.el('g', { transform: `translate(0,${box.bottom})` }, svg);
    const ya = api.el('g', { transform: `translate(${box.left},0)` }, svg);
    d3.select(xa).call(d3.axisBottom(x).ticks(w < 420 ? 3 : 5).tickSize(4).tickPadding(7));
    d3.select(ya).call(d3.axisLeft(y).ticks(4).tickSize(4).tickPadding(7));
    [xa, ya].forEach(axis => {
      d3.select(axis).selectAll('path').remove();
      d3.select(axis).selectAll('line').attr('stroke', C.border);
      d3.select(axis).selectAll('text').attr('fill', C.ink).attr('font-size', 13).attr('font-family', 'inherit');
    });
    text(api, svg, (box.left + box.right) / 2, h - 8, xLabel, { 'text-anchor': 'middle', class: 'axis-title', 'data-axis': 'x' });
    const cy = (box.top + box.bottom) / 2;
    text(api, svg, 15, cy, yLabel, { 'text-anchor': 'middle', transform: `rotate(-90,15,${cy})`, class: 'axis-title', 'data-axis': 'y' });
    const clipId = `algebra-gg-clip-${++sequence}`;
    const defs = api.el('defs', {}, svg);
    const clip = api.el('clipPath', { id: clipId }, defs);
    api.el('rect', { x: box.left, y: box.top, width: box.right - box.left, height: box.bottom - box.top }, clip);
    const marks = api.el('g', { 'clip-path': `url(#${clipId})` }, svg);
    // Tick bounds are checked after laying out the responsive axes.
    for (const axis of [xa, ya]) {
      let previous = null;
      for (const label of axis.querySelectorAll('text')) {
        const bounds = label.getBoundingClientRect();
        if (previous && bounds.left < previous.right + 4 && bounds.right > previous.left - 4 && bounds.top < previous.bottom + 4 && bounds.bottom > previous.top - 4) label.style.visibility = 'hidden';
        else previous = bounds;
      }
    }
    return { svg, marks, w, h, x, y, box };
  }
  function path(api, parent, values, p, attrs = {}) {
    return api.el('path', { d: d3.line().x(v => p.x(v[0])).y(v => p.y(v[1]))(values), fill: 'none', stroke: C.one, 'stroke-width': 2.5, ...attrs }, parent);
  }
  function caption(api, p, label) { text(api, p.svg, 64, 22, label); }
  function scene(api, points, accessible) {
    const { svg, w, h } = api.svg();
    svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', accessible);
    const xd = padded(points.map(p => p[0])), yd = padded(points.map(p => p[1]));
    const unit = Math.min((w - 48) / (xd[1] - xd[0]), (h - 64) / (yd[1] - yd[0]));
    const cx = (xd[0] + xd[1]) / 2, cy = (yd[0] + yd[1]) / 2;
    return { svg, marks: svg, w, h, x: x => w / 2 + (x - cx) * unit, y: y => (h + 18) / 2 - (y - cy) * unit };
  }
  // Replays the optimizer from its initial state in a loop. Only completed
  // steps become model state, never interpolated weights.
  function trainLoop(api, initial, count, duration, next, set, draw) {
    const states = [initial];
    for (let i = 0; i < count; i++) states.push(next(states[states.length - 1]));
    let shown = -1;
    const show = index => { shown = index; set(states[index]); draw(); };
    api.loop(duration, progress => {
      const index = Math.min(count, Math.floor(progress * count));
      if (index !== shown) show(index);
    });
    return { redraw: () => show(Math.max(0, shown)) };
  }
  const stepsHtml = (k, total) => `<p style="margin:0">passo <span class="hot">${k}</span> de ${total}</p>`;

  lab.register({
    id: 'gradiente-download', topic: 'Gradiente descendente', title: 'Estimar o tempo de download',
    application: 'O app aprende com downloads anteriores para estimar quanto um novo arquivo vai demorar.',
    connection: 'Gradiente descendente → corrige pequenos erros até melhorar a previsão.',
    source: { label: 'Google · gradiente descendente', url: 'https://developers.google.com/machine-learning/crash-course/linear-regression/gradient-descent' },
    mount(api) {
      const data = [[.5, 8], [1, 13], [1.5, 17], [2, 21], [3, 29], [3.5, 32], [4, 39], [5, 44]];
      const steps = 30, rate = .15; let state = { a: 0, b: 8, iteration: 0 };
      const predict = (s, x) => s.a * ((x - 2.5) / 2.5) + s.b;
      const mse = s => data.reduce((sum, p) => sum + (predict(s, p[0]) - p[1]) ** 2, 0) / data.length;
      const next = s => {
        let ga = 0, gb = 0;
        for (const [x, y] of data) { const z = (x - 2.5) / 2.5, error = predict(s, x) - y; ga += 2 * error * z / data.length; gb += 2 * error / data.length; }
        return { a: s.a - rate * ga, b: s.b - rate * gb, iteration: s.iteration + 1 };
      };
      const firstError = mse(state);
      function draw() {
        const endpoints = [[0, predict(state, 0)], [5, predict(state, 5)]];
        const p = plot(api, [...data, [0, 0], [5, 48], ...endpoints], 'Tamanho (GB)', 'Tempo (s)', 'Tempos fictícios de download e reta ajustada por gradiente descendente.');
        caption(api, p, '● downloads anteriores    ━ previsão    ┆ erro');
        for (const [x, y] of data) {
          line(api, p.marks, [p.x(x), p.y(y)], [p.x(x), p.y(predict(state, x))], { stroke: C.three, 'stroke-width': 2, 'stroke-dasharray': '3 3' });
          point(api, p.marks, p.x(x), p.y(y), 'circle', C.two, 6);
        }
        path(api, p.marks, endpoints, p, { 'stroke-width': 3 });
        const error = mse(state), slope = state.a / 2.5, intercept = state.b - state.a;
        api.math('aprender = descer o erro', stepsHtml(state.iteration, steps) +
          `<p style="margin:4px 0 0">w ← w − α · ∇erro</p><p>erro médio = <span class="hot">${fmt(error, 1)}</span></p>` +
          `<div style="height:8px;border-radius:4px;background:var(--border);margin-top:4px"><div style="height:8px;border-radius:4px;background:var(--viz-series-3);width:${Math.max(2, error / firstError * 100)}%"></div></div>` +
          `<p>tempo ≈ ${fmt(slope, 1)} · GB + ${fmt(intercept, 1)}</p><p class="muted">Cada passo ajusta a reta um pouco na direção que diminui as linhas roxas.</p>`);
      }
      api.onResize(() => draw());
      api.status('O app começa chutando e, a cada passo, corrige a reta na direção que mais reduz o erro.');
      trainLoop(api, state, steps, 2600, next, s => { state = s; }, draw);
    }
  });

  lab.register({
    id: 'gradiente-spam', topic: 'Gradiente descendente', title: 'Aprender a separar spam',
    application: 'O filtro aprende com mensagens conhecidas para reconhecer uma oferta suspeita.',
    connection: 'Vetores e gradiente → usam sinais da mensagem para melhorar o filtro.',
    source: { label: 'Google · regressão logística', url: 'https://developers.google.com/machine-learning/crash-course/logistic-regression' },
    mount(api) {
      const data = [[1, 0, 0], [2, 1, 0], [3, 1, 0], [1, 2, 0], [4, 0, 0], [3, 2, 0], [2, 0, 0], [6, 4, 1], [8, 3, 1], [9, 6, 1], [7, 5, 1], [10, 4, 1], [6, 3, 1], [8, 5, 1]];
      const steps = 40; let state = { a: 0, b: 1, c: -.5, iteration: 0 }, query = [9, 2], message = 'Ganhe um prêmio!';
      const probability = (s, x, y) => sigmoid(s.a * x / 10 + s.b * y / 6 + s.c);
      const loss = s => -data.reduce((sum, [x, y, label]) => { const p = Math.max(1e-12, Math.min(1 - 1e-12, probability(s, x, y))); return sum + label * Math.log(p) + (1 - label) * Math.log(1 - p); }, 0) / data.length;
      const next = s => {
        const g = [0, 0, 0];
        for (const [x, y, label] of data) { const e = probability(s, x, y) - label; g[0] += e * x / 10 / data.length; g[1] += e * y / 6 / data.length; g[2] += e / data.length; }
        return { a: s.a - .8 * g[0], b: s.b - .8 * g[1], c: s.c - .8 * g[2], iteration: s.iteration + 1 };
      };
      function draw() {
        const p = plot(api, [...data, [0, 0], [10, 6]], 'Palavras promocionais (nº)', 'Links (nº)', 'Mensagens comuns em círculos, spam em cruzes e a mensagem escolhida em losango. A linha separa as regiões onde o filtro sugere mensagem comum ou spam.');
        caption(api, p, '● comum    × spam    ◆ sua mensagem');
        const a = state.a / 10, b = state.b / 6, c = state.c;
        const [xmin, xmax] = p.x.domain(), [ymin, ymax] = p.y.domain();
        const intersections = [];
        if (Math.abs(b) > 1e-10) for (const x of [xmin, xmax]) { const y = -(a * x + c) / b; if (y >= ymin && y <= ymax) intersections.push([x, y]); }
        if (Math.abs(a) > 1e-10) for (const y of [ymin, ymax]) { const x = -(b * y + c) / a; if (x >= xmin && x <= xmax) intersections.push([x, y]); }
        if (intersections.length > 1) path(api, p.marks, intersections.slice(0, 2), p, { stroke: C.ink, 'stroke-width': 2, 'stroke-dasharray': '6 4' });
        for (const [x, y, label] of data) point(api, p.marks, p.x(x), p.y(y), label ? 'cross' : 'circle', label ? C.two : C.one, 6);
        point(api, p.marks, p.x(query[0]), p.y(query[1]), 'diamond', C.three, 9);
        const chance = probability(state, ...query);
        api.math('pesos aprendidos', stepsHtml(state.iteration, steps) +
          `<p style="margin:4px 0 0">w = (${fmt(state.a, 1)}; ${fmt(state.b, 1)}; ${fmt(state.c, 1)})</p><p>erro = ${fmt(loss(state), 2)}</p>` +
          `<p>“${message}”</p><p>chance de spam = <span class="hot">${fmt(chance * 100, 0)}%</span> → ${chance >= .5 ? 'spam' : 'comum'}</p>` +
          '<p class="muted">A mensagem vira um vetor (palavras, links). O gradiente gira a linha até separar os grupos.</p>');
      }
      api.select('Mensagem fictícia', [{ value: 'offer', label: '“Ganhe um prêmio!”' }, { value: 'class', label: '“Aula hoje às 19h”' }], 'offer', v => { query = v === 'offer' ? [9, 2] : [1, 0]; message = v === 'offer' ? 'Ganhe um prêmio!' : 'Aula hoje às 19h'; training.redraw(); });
      api.onResize(() => training.redraw());
      api.status('No começo o filtro erra. A cada passo, a linha tracejada gira até separar spam de mensagem comum.');
      const training = trainLoop(api, state, steps, 2600, next, s => { state = s; }, draw);
    }
  });

  lab.register({
    id: 'gradiente-alinhamento', topic: 'Gradiente descendente', title: 'Alinhar duas capturas',
    application: 'Um editor sobrepõe duas capturas do mesmo lugar para alinhar suas formas.',
    connection: 'Gradiente e translação → aproximam pontos que deveriam coincidir.',
    source: { label: 'SimpleITK · registro e otimização', url: 'https://simpleitk.readthedocs.io/en/v2.5.0/link_ImageRegistrationOptimizerWeights_docs.html' },
    mount(api) {
      const reference = [[-1.4, -1], [-1.4, .5], [0, 1.6], [1.4, .5], [1.4, -1]];
      const shift = [1.1, -.8], rate = .35, steps = 18; let state = { tx: 0, ty: 0, iteration: 0 };
      const source = () => reference.map(p => [p[0] + shift[0], p[1] + shift[1]]);
      const transformed = s => source().map(p => [p[0] + s.tx, p[1] + s.ty]);
      const loss = s => transformed(s).reduce((sum, p, i) => sum + (p[0] - reference[i][0]) ** 2 + (p[1] - reference[i][1]) ** 2, 0) / (2 * reference.length);
      const next = s => {
        const current = transformed(s);
        const gx = current.reduce((sum, p, i) => sum + p[0] - reference[i][0], 0) / current.length;
        const gy = current.reduce((sum, p, i) => sum + p[1] - reference[i][1], 0) / current.length;
        return { tx: s.tx - rate * gx, ty: s.ty - rate * gy, iteration: s.iteration + 1 };
      };
      function draw() {
        const current = transformed(state);
        const p = scene(api, [...reference, ...source()], 'Contornos de duas capturas da mesma casa, ligados por pontos correspondentes. A captura móvel se desloca até se sobrepor à referência.');
        text(api, p.svg, 20, 24, '● referência    ■ segunda captura');
        current.forEach((v, i) => line(api, p.marks, [p.x(v[0]), p.y(v[1])], [p.x(reference[i][0]), p.y(reference[i][1])], { stroke: C.three, 'stroke-width': 1.5, 'stroke-dasharray': '3 3' }));
        path(api, p.marks, [...reference, reference[0]], p, { stroke: C.two, 'stroke-width': 2.5, fill: C.two, 'fill-opacity': .08 });
        path(api, p.marks, [...current, current[0]], p, { stroke: C.one, 'stroke-width': 2.5, fill: C.one, 'fill-opacity': .1 });
        reference.forEach(v => point(api, p.marks, p.x(v[0]), p.y(v[1]), 'circle', C.two, 6));
        current.forEach(v => point(api, p.marks, p.x(v[0]), p.y(v[1]), 'square', C.one, 5));
        api.math('vetor de translação', stepsHtml(state.iteration, steps) +
          `<p style="margin:4px 0 0">t ← t − α · ∇erro</p><p>t = (<span class="hot">${fmt(state.tx)}</span>; <span class="hot">${fmt(state.ty)}</span>)</p>` +
          `<p>erro = ${fmt(loss(state), 3)}</p><p class="muted">Somar t a todos os pontos move a forma inteira. O gradiente aponta para onde o erro (linhas roxas) diminui.</p>`);
      }
      api.onResize(() => draw());
      api.status('A segunda captura desliza passo a passo até coincidir com a referência.');
      trainLoop(api, state, steps, 2200, next, s => { state = s; }, draw);
    }
  });

  const graphicsSource = { label: 'MDN · matrizes e projeção WebGL', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_model_view_projection' };
  function rotate2(point, degrees, scale = 1) { const a = rad(degrees); return [scale * (Math.cos(a) * point[0] - Math.sin(a) * point[1]), scale * (Math.sin(a) * point[0] + Math.cos(a) * point[1])]; }
  const ease = t => t * t * (3 - 2 * t);
  lab.register({
    id: 'grafica-sprite', topic: 'Computação Gráfica', title: 'Girar e aumentar a nave do jogo',
    application: 'O jogo gira e aumenta a nave sem precisar desenhá-la de novo.',
    connection: 'Matrizes → giram e redimensionam os objetos do jogo.',
    source: graphicsSource,
    mount(api) {
      const shape = [[1.25, 0], [-.9, .68], [-.48, 0], [-.9, -.68]];
      let angle = 0, scale = 1;
      function draw() {
        const transformed = shape.map(p => rotate2(p, angle, scale));
        const p = scene(api, [[-1.7, -1.7], [1.7, 1.7]], 'Nave de um jogo. O contorno pontilhado mostra a posição e o tamanho originais; a nave preenchida mostra a transformação.');
        text(api, p.svg, 20, 24, '⋯ original    ━ nave transformada');
        path(api, p.marks, [...shape, shape[0]], p, { stroke: C.ink, 'stroke-width': 1.5, 'stroke-dasharray': '4 4' });
        path(api, p.marks, [...transformed, transformed[0]], p, { fill: C.one, 'fill-opacity': .2, stroke: C.one, 'stroke-width': 3 });
        transformed.forEach(v => point(api, p.marks, p.x(v[0]), p.y(v[1]), 'circle', C.one, 4));
        point(api, p.marks, p.x(0), p.y(0), 'circle', C.ink, 3);
        const a = rad(angle), c = Math.cos(a) * scale, s = Math.sin(a) * scale, tip = transformed[0];
        api.math('rotação e escala', `<p style="margin:0">θ = <span class="hot">${fmt(angle, 0)}°</span> · s = ${fmt(scale)}</p>` +
          `<div style="display:flex;align-items:center;gap:6px;margin-top:6px"><span>M =</span>${api.matrix([[fmt(c), fmt(-s)], [fmt(s), fmt(c)]])}</div>` +
          `<p>bico: M · (1,25; 0) = (${fmt(tip[0])}; ${fmt(tip[1])})</p><p class="muted">Cada vértice é multiplicado pela mesma matriz. O desenho original nunca muda.</p>`);
      }
      api.range('Tamanho da nave (%)', 60, 150, 10, scale * 100, v => { scale = v / 100; draw(); });
      api.onResize(draw);
      api.status('Uma única matriz gira e aumenta todos os pontos da nave de uma vez.');
      api.loop(3200, t => { angle = 360 * ease(t); draw(); });
    }
  });

  lab.register({
    id: 'grafica-camera', topic: 'Computação Gráfica', title: 'Aproximar a câmera muda a cena',
    application: 'Ao aproximar a câmera, o mesmo objeto ocupa mais espaço na tela.',
    connection: 'Projeção → transforma uma cena 3D nos pixels que vemos.',
    source: graphicsSource,
    mount(api) {
      const vertices = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
      const faces = [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [3, 7, 6, 2], [0, 4, 7, 3], [1, 2, 6, 5]];
      const yaw = 25, far = 9, near = 4.5; let distance = far;
      function rotated(v) {
        const a = rad(yaw), b = rad(20);
        const x = v[0] * Math.cos(a) + v[2] * Math.sin(a), z = -v[0] * Math.sin(a) + v[2] * Math.cos(a);
        return [x, v[1] * Math.cos(b) - z * Math.sin(b), v[1] * Math.sin(b) + z * Math.cos(b)];
      }
      function draw() {
        const { svg, w, h } = api.svg(); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Cubo tridimensional em perspectiva. Ele parece maior quando a câmera se aproxima, embora seu tamanho real não mude.');
        const box = { x: 20, y: 42, width: w - 40, height: h - 76 };
        text(api, svg, 20, 26, `Câmera a ${fmt(distance, 1)} m do cubo`);
        api.el('rect', { x: box.x, y: box.y, width: box.width, height: box.height, rx: 8, fill: 'none', stroke: C.border }, svg);
        const f = Math.min(box.width, box.height) * 1.1;
        const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
        const world = vertices.map(rotated);
        const screen = world.map(v => { const denom = distance - v[2]; return [cx + f * v[0] / denom, cy - f * v[1] / denom]; });
        const sorted = faces.map((face, i) => ({ face, i, depth: face.reduce((s, index) => s + world[index][2], 0) / 4 })).sort((a, b) => a.depth - b.depth);
        for (const { face, depth } of sorted) {
          api.el('polygon', { points: face.map(index => screen[index].join(',')).join(' '), fill: C.one, 'fill-opacity': .06 + ((depth + 1.75) / 3.5) * .16, stroke: C.ink, 'stroke-width': 1.6 }, svg);
        }
        screen.forEach(p => point(api, svg, p[0], p[1], 'circle', C.one, 3));
        text(api, svg, w / 2, h - 12, 'Mesmo cubo, outra distância', { 'text-anchor': 'middle' });
        const factor = f / distance;
        api.math('projeção em perspectiva', '<p style="margin:0">x<sub>tela</sub> = f · x / z</p><p style="margin:0">y<sub>tela</sub> = f · y / z</p>' +
          `<p>z = <span class="hot">${fmt(distance, 1)}</span> → escala f/z = <span class="hot">${fmt(factor, 0)}</span></p>` +
          `<p>tamanho na tela: <span class="hot">${fmt(far / distance, 1)}×</span> o de longe</p><p class="muted">Dividir pela distância é o que faz o longe parecer pequeno.</p>`);
      }
      api.onResize(draw);
      api.status('O cubo não muda de tamanho. A divisão pela distância z é que faz ele crescer na tela.');
      api.loop(1800, t => { distance = far + (near - far) * ease(t); draw(); }, { yoyo: true });
    }
  });

  lab.register({
    id: 'grafica-braco', topic: 'Computação Gráfica', title: 'Animar um braço articulado',
    application: 'A mão continua ligada ao braço enquanto o personagem levanta o braço ou acena.',
    connection: 'Matrizes em sequência → fazem a mão acompanhar o braço do personagem.',
    source: graphicsSource,
    mount(api) {
      let shoulder = 35, elbow = 65;
      const lengths = [1.4, 1.1];
      const joints = () => { const mid = rotate2([lengths[0], 0], shoulder), offset = rotate2([lengths[1], 0], shoulder + elbow); return [[0, 0], mid, [mid[0] + offset[0], mid[1] + offset[1]]]; };
      let shoulderInput, elbowInput;
      function draw() {
        const j = joints();
        const p = scene(api, [[-2.5, -1.8], [2.5, 2.6]], 'Personagem com um braço articulado. Ao mover o ombro, o antebraço e a mão acompanham; ao dobrar o cotovelo, apenas o antebraço e a mão mudam.');
        text(api, p.svg, 20, 24, 'Ombro → cotovelo → mão');
        const body = [[[-.35, .15], [-.35, -1]], [[-.35, -1], [-.95, -1.65]], [[-.35, -1], [.25, -1.65]], [[-.35, 0], [-1, -.65]], [[-.35, 0], [0, 0]]];
        body.forEach(([a, b]) => line(api, p.marks, [p.x(a[0]), p.y(a[1])], [p.x(b[0]), p.y(b[1])], { stroke: C.ink, 'stroke-width': 6, 'stroke-linecap': 'round' }));
        api.el('circle', { cx: p.x(-.35), cy: p.y(.52), r: Math.abs(p.x(.25) - p.x(0)), fill: 'none', stroke: C.ink, 'stroke-width': 2.5 }, p.marks);
        line(api, p.marks, [p.x(j[0][0]), p.y(j[0][1])], [p.x(j[1][0]), p.y(j[1][1])], { stroke: C.one, 'stroke-width': 10, 'stroke-linecap': 'round' });
        line(api, p.marks, [p.x(j[1][0]), p.y(j[1][1])], [p.x(j[2][0]), p.y(j[2][1])], { stroke: C.two, 'stroke-width': 10, 'stroke-linecap': 'round' });
        j.forEach((v, index) => { api.el('circle', { cx: p.x(v[0]), cy: p.y(v[1]), r: index === 2 ? 8 : 9, fill: C.bg, stroke: C.ink, 'stroke-width': 2 }, p.marks); });
        api.math('matrizes em sequência', '<p style="margin:0">mão = R(θ₁)·[L₁] + R(θ₁+θ₂)·[L₂]</p>' +
          `<p>θ₁ ombro = <span class="hot">${fmt(shoulder, 0)}°</span></p><p style="margin:0">θ₂ cotovelo = <span class="hot">${fmt(elbow, 0)}°</span></p>` +
          `<p>mão = (${fmt(j[2][0])}; ${fmt(j[2][1])})</p><p class="muted">Girar o ombro carrega o cotovelo e a mão juntos: as rotações se acumulam.</p>`);
      }
      const sync = () => { [[shoulderInput, shoulder], [elbowInput, elbow]].forEach(([input, value]) => { input.value = Math.round(value); if (input.previousElementSibling) input.previousElementSibling.textContent = String(Math.round(value)); }); };
      shoulderInput = api.range('Levantar o braço', 0, 150, 5, shoulder, v => { api.cancel(); shoulder = v; draw(); });
      elbowInput = api.range('Dobrar o cotovelo', 0, 130, 5, elbow, v => { api.cancel(); elbow = v; draw(); });
      api.onResize(draw);
      api.status('O personagem acena sozinho. Arraste os controles para assumir o braço.');
      api.loop(2400, t => { const wave = Math.sin(t * Math.PI * 2); shoulder = 70 + 35 * Math.sin(t * Math.PI); elbow = 60 + 40 * wave; sync(); draw(); });
    }
  });
})();
