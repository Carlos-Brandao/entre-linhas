(() => {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const DURATION = 2200;
  const ACCENT = 'var(--motion-accent, #63e6d5)';
  const INK = '#f4f5f2';
  const MUTED = '#aeb7bd';
  const GRID = '#ffffff18';
  const OBSERVATIONS = [[1, 3], [2, 4.8], [3, 7.2], [4, 9], [5, 11]];
  const NODES = [[70, 65], [240, 65], [240, 160], [70, 160]];
  const NODE_NAMES = ['A', 'B', 'C', 'D'];
  const EDGES = [[0, 1], [1, 2], [2, 3], [3, 0]];

  function element(name, attributes = {}, text) {
    const node = document.createElementNS(SVG_NS, name);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function label(x, y, text, attributes = {}) {
    return element('text', { x, y, fill: MUTED, 'font-size': 12, ...attributes }, text);
  }

  function clamp(value) { return Math.max(0, Math.min(1, value)); }
  function ease(value) { return value * value * (3 - 2 * value); }
  function number(value) { return Number(value.toFixed(2)).toString(); }

  function coordinates(xRange, yRange, bounds) {
    return ([x, y]) => [
      bounds.left + (x - xRange[0]) / (xRange[1] - xRange[0]) * (bounds.right - bounds.left),
      bounds.bottom - (y - yRange[0]) / (yRange[1] - yRange[0]) * (bounds.bottom - bounds.top)
    ];
  }

  function line(from, to, attributes = {}) {
    return element('line', { x1: from[0], y1: from[1], x2: to[0], y2: to[1], ...attributes });
  }

  function plotAxes(root, point, xTicks, yTicks, xLabel, yLabel, bounds) {
    for (const tick of xTicks) {
      const x = point([tick, 0])[0];
      root.append(line([x, bounds.top], [x, bounds.bottom], { stroke: GRID, 'stroke-width': 1 }));
      root.append(label(x, bounds.bottom + 18, number(tick), { 'text-anchor': 'middle' }));
    }
    for (const tick of yTicks) {
      const y = point([0, tick])[1];
      root.append(line([bounds.left, y], [bounds.right, y], { stroke: GRID, 'stroke-width': 1 }));
      root.append(label(bounds.left - 9, y + 4, number(tick), { 'text-anchor': 'end' }));
    }
    root.append(
      line([bounds.left, bounds.top], [bounds.left, bounds.bottom], { stroke: '#ffffff58', 'stroke-width': 1.2 }),
      line([bounds.left, bounds.bottom], [bounds.right, bounds.bottom], { stroke: '#ffffff58', 'stroke-width': 1.2 }),
      label((bounds.left + bounds.right) / 2, 222, xLabel, { 'text-anchor': 'middle', fill: INK }),
      label(14, (bounds.top + bounds.bottom) / 2, yLabel, {
        'text-anchor': 'middle', fill: INK,
        transform: `rotate(-90 14 ${(bounds.top + bounds.bottom) / 2})`
      })
    );
  }

  function regression(root, descriptor, preview) {
    const bounds = { left: 48, right: 302, top: 26, bottom: 180 };
    const point = coordinates([0, 6], [0, 14], bounds);
    plotAxes(root, point, [0, 1, 2, 3, 4, 5, 6], [0, 4, 8, 12, 14], 'Distância (km)', 'Tempo (min)', bounds);
    root.append(label(302, 16, '5 observações', { 'text-anchor': 'end' }));
    const residuals = element('g', { stroke: ACCENT, 'stroke-width': 1.7, 'stroke-dasharray': '4 4' });
    const candidate = line(point([0, descriptor.intercept || 0]), point([0, descriptor.intercept || 0]), {
      stroke: ACCENT, 'stroke-width': 3, 'stroke-linecap': 'round'
    });
    const residualLines = [];
    if (!preview) {
      OBSERVATIONS.forEach(([x, y]) => {
        const residual = line(point([x, y]), point([x, descriptor.slope * x + descriptor.intercept]), { opacity: 0 });
        residuals.append(residual);
        residualLines.push(residual);
      });
      root.append(residuals, candidate);
    }
    for (const [x, y] of OBSERVATIONS) {
      const [cx, cy] = point([x, y]);
      const dot = element('circle', { cx, cy, r: 4.4, fill: INK, stroke: '#0b0c0d', 'stroke-width': 1.5 });
      dot.append(element('title', {}, `${x} km: ${number(y)} minutos`));
      root.append(dot);
    }
    return {
      draw(progress) {
        if (preview) return;
        const x = 6 * ease(progress);
        const end = point([x, descriptor.slope * x + descriptor.intercept]);
        candidate.setAttribute('x2', end[0]);
        candidate.setAttribute('y2', end[1]);
        residualLines.forEach((residual, index) => residual.setAttribute('opacity', .75 * clamp((x - OBSERVATIONS[index][0]) * 3)));
      },
      description: preview
        ? 'Gráfico de distância em quilômetros e tempo em minutos, com cinco observações: 1 e 3; 2 e 4,8; 3 e 7,2; 4 e 9; 5 e 11. Nenhuma reta foi ajustada.'
        : `${descriptor.description}. Reta: tempo igual a ${number(descriptor.slope)} vezes a distância, mais ${number(descriptor.intercept)}. Pontos brancos: observações. Segmentos tracejados: diferenças entre a reta e os dados.`
    };
  }

  function gradient(root, descriptor, preview) {
    const bounds = { left: 48, right: 302, top: 26, bottom: 174 };
    const point = coordinates([-1.5, 6.5], [0, 21], bounds);
    plotAxes(root, point, [-1, 0, 1, 3, 6], [0, 4, 9, 16, 21], 'Parâmetro w', 'Erro E(w)', bounds);
    root.append(label(302, 16, 'E(w) = (w − 3)²', { 'text-anchor': 'end', fill: INK }));
    function curve(from, to) {
      const vertices = [];
      for (let index = 0; index <= 100; index += 1) {
        const w = from + (to - from) * index / 100;
        vertices.push(point([w, (w - 3) ** 2]).join(','));
      }
      return vertices.join(' ');
    }
    root.append(element('polyline', { points: curve(-1.5, 6.5), fill: 'none', stroke: '#bec9cf', 'stroke-width': 2.2 }));
    const [startX, startY] = point([0, 9]);
    const start = element('circle', { cx: startX, cy: startY, r: 6.7, fill: '#0b0c0d', stroke: INK, 'stroke-width': 1.8, 'stroke-dasharray': '3 2' });
    const startLabel = label(startX + 10, startY - 12, 'Início: w = 0', { fill: INK, 'font-size': 11.5 });
    root.append(start, startLabel);
    const trail = element('polyline', { fill: 'none', stroke: ACCENT, 'stroke-width': 3.2, 'stroke-linecap': 'round' });
    const halo = element('circle', { cx: startX, cy: startY, r: 11, fill: ACCENT, opacity: .16 });
    const dot = element('circle', { cx: startX, cy: startY, r: 5.5, fill: ACCENT, stroke: '#0b0c0d', 'stroke-width': 1.4 });
    const result = label(175, 208, '', { fill: ACCENT, 'text-anchor': 'middle', 'font-size': 12 });
    if (!preview) root.append(trail, halo, dot, result);
    return {
      draw(progress) {
        if (preview) return;
        const w = descriptor.target * ease(progress);
        const error = (w - 3) ** 2;
        const [cx, cy] = point([w, error]);
        trail.setAttribute('points', curve(0, w));
        [halo, dot].forEach(node => { node.setAttribute('cx', cx); node.setAttribute('cy', cy); });
        halo.setAttribute('r', 11 + (descriptor.target === 0 ? 5 * Math.sin(Math.PI * progress) : 0));
        dot.setAttribute('r', 5.5 + (descriptor.target === 0 ? 1.5 * Math.sin(Math.PI * progress) : 0));
        result.textContent = `w = ${number(w)} · erro = ${number(error)}`;
      },
      description: preview
        ? 'Curva de erro E(w) igual a (w menos 3) ao quadrado. O ponto inicial tem w igual a 0 e erro igual a 9.'
        : `${descriptor.description}. O parâmetro parte de 0, com erro 9, e chega a ${number(descriptor.target)}, com erro ${number((descriptor.target - 3) ** 2)}. Contorno tracejado: ponto inicial. Ponto colorido: posição atual.`
    };
  }

  function graph(root, descriptor, preview) {
    root.append(label(160, 23, 'Rede de quatro nós', { 'text-anchor': 'middle', fill: INK }));
    for (const [from, to] of EDGES) {
      root.append(line(NODES[from], NODES[to], { stroke: '#ffffff50', 'stroke-width': 2.2 }));
    }
    const highlightedEdges = [];
    const cells = [];
    const invalid = !preview && descriptor.row[2] === 1;
    if (!preview) {
      for (let index = 1; index < 4; index += 1) {
        if (descriptor.row[index] !== 1) continue;
        const connection = line(NODES[0], NODES[0], {
          stroke: ACCENT, 'stroke-width': 3.4, 'stroke-linecap': 'round', opacity: 0,
          ...(index === 2 ? { 'stroke-dasharray': '5 5' } : {})
        });
        root.append(connection);
        highlightedEdges.push({ connection, index });
      }
    }
    NODES.forEach(([cx, cy], index) => {
      root.append(
        element('circle', { cx, cy, r: 17, fill: '#151a1d', stroke: !preview && index === 0 ? ACCENT : '#ffffff72', 'stroke-width': 1.7 }),
        label(cx, cy + 4.6, NODE_NAMES[index], { fill: INK, 'font-size': 14, 'text-anchor': 'middle' })
      );
    });
    if (!preview) {
      if (invalid) root.append(label(160, 190, 'C: sem ligação direta', { 'text-anchor': 'middle', 'font-size': 11, fill: ACCENT }));
      for (let index = 0; index < 4; index += 1) {
        const x = 52 + 72 * index;
        const cell = element('g', { opacity: 0 });
        cell.append(
          label(x, 205, NODE_NAMES[index], { 'text-anchor': 'middle', 'font-size': 12 }),
          element('rect', { x: x - 25, y: 210, width: 50, height: 20, rx: 5, fill: descriptor.row[index] ? ACCENT : '#ffffff0d', 'fill-opacity': descriptor.row[index] ? .13 : 1, stroke: descriptor.row[index] ? ACCENT : '#ffffff30', 'stroke-width': 1 }),
          label(x, 225, descriptor.row[index], { 'text-anchor': 'middle', fill: descriptor.row[index] ? ACCENT : INK, 'font-size': 13 })
        );
        root.append(cell);
        cells.push(cell);
      }
    }
    return {
      draw(progress) {
        if (preview) return;
        cells.forEach((cell, index) => cell.setAttribute('opacity', clamp(progress * 4 - index)));
        highlightedEdges.forEach(({ connection, index }) => {
          const reveal = ease(clamp(progress * 4 - index));
          const [x0, y0] = NODES[0];
          const [x1, y1] = NODES[index];
          connection.setAttribute('x2', x0 + (x1 - x0) * reveal);
          connection.setAttribute('y2', y0 + (y1 - y0) * reveal);
          connection.setAttribute('opacity', reveal);
        });
      },
      description: preview
        ? 'Rede sem direção com nós A, B, C e D. As ligações existentes são A com B, B com C, C com D e D com A.'
        : `${descriptor.description}. Na ordem A, B, C, D, a linha exibida é ${descriptor.row.join(', ')}. Um significa ligação direta; zero significa ausência de ligação. Ligações existentes: A com B, B com C, C com D e D com A.${invalid ? ' A ligação proposta entre A e C é tracejada porque não existe na rede.' : ''}`
    };
  }

  function validate(descriptor, preview) {
    if (!descriptor || !['regression', 'gradient', 'graph'].includes(descriptor.kind)) {
      throw new TypeError('A animação aplicada requer um tipo: regression, gradient ou graph.');
    }
    const result = { ...descriptor, description: typeof descriptor.description === 'string' ? descriptor.description.trim() : '' };
    if (preview) return result;
    if (!result.description) throw new TypeError('A animação aplicada requer uma descrição.');
    if (result.kind === 'regression' && (!Number.isFinite(result.slope) || !Number.isFinite(result.intercept))) {
      throw new TypeError('A regressão requer coeficientes finitos.');
    }
    if (result.kind === 'gradient' && (!Number.isFinite(result.target) || result.target < -1.5 || result.target > 6.5)) {
      throw new RangeError('O destino do parâmetro deve estar entre −1,5 e 6,5.');
    }
    if (result.kind === 'graph') {
      if (!Array.isArray(result.row) || result.row.length !== 4 || result.row.some(value => value !== 0 && value !== 1) || result.row[0] !== 0) {
        throw new TypeError('A linha do grafo deve conter quatro valores binários, sem ligação de A com ele mesmo.');
      }
      result.row = [...result.row];
    }
    return result;
  }

  function create(svg, value, { preview = false, onComplete } = {}) {
    if (!svg || svg.namespaceURI !== SVG_NS || svg.tagName.toLowerCase() !== 'svg') {
      throw new TypeError('EntreLinhasApplied.create requer um elemento SVG.');
    }
    const descriptor = validate(value, preview);
    const priorAttributes = new Map(['role', 'aria-label', 'viewBox', 'preserveAspectRatio'].map(name => [name, svg.getAttribute(name)]));
    const root = element('g', { 'font-family': 'inherit' });
    const drawing = ({ regression, gradient, graph })[descriptor.kind](root, descriptor, preview);
    root.prepend(element('title', {}, drawing.description));
    svg.append(root);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', drawing.description);
    svg.setAttribute('viewBox', '0 0 320 230');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let progress = 0;
    let playing = false;
    let destroyed = false;
    let completed = false;
    let frame = null;
    let lastTime = null;
    drawing.draw(progress);

    function cancel() {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = null;
      lastTime = null;
    }

    function complete() {
      progress = 1;
      playing = false;
      cancel();
      drawing.draw(progress);
      if (!completed) {
        completed = true;
        if (typeof onComplete === 'function') onComplete();
      }
    }

    function schedule() {
      if (!destroyed && playing && !document.hidden && frame === null) frame = window.requestAnimationFrame(tick);
    }

    function tick(time) {
      frame = null;
      if (destroyed || !playing || document.hidden) { lastTime = null; return; }
      if (lastTime !== null) progress = Math.min(1, progress + (time - lastTime) / DURATION);
      lastTime = time;
      if (progress === 1) complete();
      else { drawing.draw(progress); schedule(); }
    }

    function play() {
      if (destroyed || playing) return;
      if (preview || preference.matches || progress === 1) { complete(); return; }
      playing = true;
      lastTime = null;
      schedule();
    }

    function pause() {
      if (destroyed) return;
      playing = false;
      cancel();
    }

    function restart() {
      if (destroyed) return;
      playing = false;
      cancel();
      progress = 0;
      completed = false;
      drawing.draw(progress);
      play();
    }

    function visibilityChanged() { cancel(); if (!document.hidden) schedule(); }
    function preferenceChanged() { if (preference.matches && playing) complete(); }
    document.addEventListener('visibilitychange', visibilityChanged);
    preference.addEventListener('change', preferenceChanged);

    return {
      play, pause, restart,
      get progress() { return progress; },
      get playing() { return playing; },
      destroy() {
        if (destroyed) return;
        destroyed = true;
        playing = false;
        cancel();
        document.removeEventListener('visibilitychange', visibilityChanged);
        preference.removeEventListener('change', preferenceChanged);
        root.remove();
        priorAttributes.forEach((attribute, name) => {
          if (attribute === null) svg.removeAttribute(name);
          else svg.setAttribute(name, attribute);
        });
      }
    };
  }

  window.EntreLinhasApplied = Object.freeze({ create });
})();
