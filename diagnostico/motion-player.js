(() => {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const DURATION = 2200;
  const SHAPE = [[.8, .55], [2.1, .55], [2.1, .1], [3, 1], [2.1, 1.6], [2.1, 1.15], [.8, 1.15]];
  const MARKERS = [[3, 1], [1.2, .85]];
  const LEGACY_TRANSFORMS = [
    { matrix: [[0, 1], [1, 0]], description: 'Reflexão na reta y igual a x' },
    { matrix: [[0, -1], [1, 0]], rotation: Math.PI / 2, description: 'Rotação de 90 graus no sentido anti-horário' },
    { matrix: [[-1, 0], [0, -1]], rotation: Math.PI, description: 'Rotação de 180 graus em torno da origem' },
    { matrix: [[1, 0], [0, -1]], description: 'Reflexão no eixo x' }
  ];

  function element(name, attributes = {}, text) {
    const node = document.createElementNS(SVG_NS, name);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function normalizeTransform(value) {
    if (typeof value === 'number') {
      if (!Number.isInteger(value) || value < 0 || value > 3) {
        throw new RangeError('A alternativa da animação deve estar entre 0 e 3.');
      }
      value = LEGACY_TRANSFORMS[value];
    }
    if (!value || typeof value !== 'object' || !Array.isArray(value.matrix)
      || value.matrix.length !== 2 || value.matrix.some(row => !Array.isArray(row)
        || row.length !== 2 || row.some(coefficient => !Number.isFinite(coefficient)))
      || typeof value.description !== 'string' || !value.description.trim()) {
      throw new TypeError('A transformação requer uma matriz 2 × 2 finita e uma descrição.');
    }
    const descriptor = { matrix: value.matrix.map(row => [...row]), description: value.description.trim() };
    if (value.rotation !== undefined) {
      if (!Number.isFinite(value.rotation)) throw new TypeError('O ângulo de rotação deve ser finito, em radianos.');
      const cosine = Math.cos(value.rotation);
      const sine = Math.sin(value.rotation);
      const rotationMatrix = [[cosine, -sine], [sine, cosine]];
      if (descriptor.matrix.some((row, i) => row.some((coefficient, j) => Math.abs(coefficient - rotationMatrix[i][j]) > 1e-9))) {
        throw new RangeError('A matriz deve corresponder ao ângulo de rotação informado.');
      }
      descriptor.rotation = value.rotation;
    }
    return descriptor;
  }

  function transform([x, y], descriptor, t) {
    const [[a, b], [c, d]] = descriptor.matrix;
    const endpoint = [a * x + b * y, c * x + d * y];
    if (t === 1) return endpoint;
    if (descriptor.rotation === undefined) return [(1 - t) * x + t * endpoint[0], (1 - t) * y + t * endpoint[1]];
    const angle = t * descriptor.rotation;
    return [x * Math.cos(angle) - y * Math.sin(angle), x * Math.sin(angle) + y * Math.cos(angle)];
  }

  function drawingExtent(descriptor, requestedExtent) {
    if (requestedExtent !== undefined && (!Number.isFinite(requestedExtent) || requestedExtent <= 0)) {
      throw new RangeError('A extensão da grade deve ser um número positivo e finito.');
    }
    const vertices = [...SHAPE, ...MARKERS];
    // Linear interpolation stays inside its endpoint bounds. A rotation stays
    // inside each vertex's radius, including intermediate angles and full turns.
    const coordinates = descriptor.rotation === undefined
      ? vertices.flatMap(vertex => [...vertex, ...transform(vertex, descriptor, 1)]).map(Math.abs)
      : vertices.map(([x, y]) => Math.hypot(x, y));
    if (coordinates.some(value => !Number.isFinite(value))) {
      throw new RangeError('A transformação excede os limites numéricos da animação.');
    }
    return Math.max(4, Math.ceil(Math.max(...coordinates) + .5), requestedExtent || 0);
  }

  function create(svg, transformation, { onComplete, extent } = {}) {
    if (!svg || svg.namespaceURI !== SVG_NS || svg.tagName.toLowerCase() !== 'svg') {
      throw new TypeError('EntreLinhasMotion.create requer um elemento SVG.');
    }
    const descriptor = normalizeTransform(transformation);
    const gridExtent = drawingExtent(descriptor, extent);

    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const priorAttributes = new Map(['role', 'aria-label', 'viewBox'].map(name => [name, svg.getAttribute(name)]));
    const root = element('g', { class: 'motion-drawing' });
    const grid = element('g', { class: 'motion-grid' });
    const reference = element('polygon', { class: 'motion-reference' });
    const result = element('polygon', { class: 'motion-shape' });
    const tip = element('circle', { class: 'motion-tip', r: 3.5 });
    const landmark = element('circle', { class: 'motion-landmark', r: 3 });
    root.append(grid, reference, result, tip, landmark);
    svg.append(root);
    svg.setAttribute('role', 'img');

    let width = 0;
    let height = 0;
    let progress = 0;
    let playing = false;
    let destroyed = false;
    let frame = null;
    let lastTime = null;
    let completed = false;

    function point([x, y]) {
      const scale = Math.max(1, Math.min(width, height) - 48) / gridExtent / 2;
      return [width / 2 + x * scale, height / 2 - y * scale];
    }

    function polygon(points) {
      return points.map(value => point(value).join(',')).join(' ');
    }

    function describe() {
      const state = progress === 1 ? descriptor.description : playing ? 'Transformação em movimento' : progress > 0 ? 'Transformação pausada' : 'Posição inicial';
      svg.setAttribute('aria-label', `${state}. Contorno tracejado: posição inicial. Figura preenchida: posição atual. Eixo y aponta para cima.`);
    }

    function draw() {
      const t = progress * progress * (3 - 2 * progress);
      reference.setAttribute('points', polygon(SHAPE));
      result.setAttribute('points', polygon(SHAPE.map(value => transform(value, descriptor, t))));
      [[tip, MARKERS[0]], [landmark, MARKERS[1]]].forEach(([node, value]) => {
        const [x, y] = point(transform(value, descriptor, t));
        node.setAttribute('cx', x);
        node.setAttribute('cy', y);
      });
    }

    function resize() {
      if (destroyed) return;
      const bounds = svg.getBoundingClientRect();
      const nextWidth = bounds.width || width || 280;
      const nextHeight = bounds.height || height || 200;
      if (nextWidth === width && nextHeight === height) return;
      width = nextWidth;
      height = nextHeight;
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      grid.replaceChildren();
      const gridStep = Math.max(1, 10 ** Math.ceil(Math.log10(gridExtent / 8)));
      const tickCount = Math.floor(gridExtent / gridStep);
      for (let tick = -tickCount; tick <= tickCount; tick += 1) {
        const n = tick * gridStep;
        [[[n, -gridExtent], [n, gridExtent]], [[-gridExtent, n], [gridExtent, n]]].forEach(([from, to]) => {
          const a = point(from);
          const b = point(to);
          grid.append(element('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: n === 0 ? 'motion-axis' : 'motion-gridline' }));
        });
      }
      const right = point([gridExtent, 0]);
      const top = point([0, gridExtent]);
      grid.append(
        element('circle', { cx: width / 2, cy: height / 2, r: 2.5, class: 'motion-origin' }),
        element('text', { x: right[0] + 9, y: right[1] - 7, class: 'motion-axis-label' }, 'x'),
        element('text', { x: top[0] + 8, y: top[1] - 7, class: 'motion-axis-label' }, 'y'),
        element('text', { x: width / 2 - 14, y: height / 2 + 16, class: 'motion-axis-label' }, '0')
      );
      draw();
    }

    function cancelFrame() {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = null;
      lastTime = null;
    }

    function complete() {
      progress = 1;
      playing = false;
      cancelFrame();
      draw();
      describe();
      if (!completed) {
        completed = true;
        if (typeof onComplete === 'function') onComplete();
      }
    }

    function schedule() {
      if (!destroyed && playing && !document.hidden && frame === null) {
        frame = window.requestAnimationFrame(tick);
      }
    }

    function tick(time) {
      frame = null;
      if (destroyed || !playing || document.hidden) {
        lastTime = null;
        return;
      }
      if (lastTime !== null) progress = Math.min(1, progress + (time - lastTime) / DURATION);
      lastTime = time;
      if (progress === 1) complete();
      else {
        draw();
        schedule();
      }
    }

    function play() {
      if (destroyed || playing) return;
      if (preference.matches || progress === 1) {
        complete();
        return;
      }
      playing = true;
      lastTime = null;
      describe();
      schedule();
    }

    function pause() {
      if (destroyed) return;
      playing = false;
      cancelFrame();
      describe();
    }

    function restart() {
      if (destroyed) return;
      playing = false;
      cancelFrame();
      progress = 0;
      completed = false;
      draw();
      play();
    }

    function visibilityChanged() {
      cancelFrame();
      if (!document.hidden) schedule();
    }

    function preferenceChanged() {
      if (preference.matches && playing) complete();
    }

    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
    if (observer) observer.observe(svg);
    else window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', visibilityChanged);
    preference.addEventListener('change', preferenceChanged);
    resize();
    describe();

    return {
      play,
      pause,
      restart,
      get progress() { return progress; },
      get playing() { return playing; },
      destroy() {
        if (destroyed) return;
        destroyed = true;
        playing = false;
        cancelFrame();
        if (observer) observer.disconnect();
        else window.removeEventListener('resize', resize);
        document.removeEventListener('visibilitychange', visibilityChanged);
        preference.removeEventListener('change', preferenceChanged);
        root.remove();
        priorAttributes.forEach((value, name) => {
          if (value === null) svg.removeAttribute(name);
          else svg.setAttribute(name, value);
        });
      }
    };
  }

  window.EntreLinhasMotion = Object.freeze({ create });
})();
