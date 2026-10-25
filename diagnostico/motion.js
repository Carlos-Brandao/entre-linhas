(() => {
  const root = document.getElementById('entre-linhas-motion-demo');
  const panelsHost = root.querySelector('[data-panels]');
  const playAll = root.querySelector('[data-play-all]');
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const shape = [[.8,.55],[2.1,.55],[2.1,.1],[3,1],[2.1,1.6],[2.1,1.15],[.8,1.15]];
  const definitions = [
    { letter: 'A', formula: '(x, y) → (y, x)', end: 'Reflexão na reta y igual a x.' },
    { letter: 'B', formula: '(x, y) → (−y, x)', end: 'Rotação de 90 graus no sentido anti-horário.' },
    { letter: 'C', formula: '(x, y) → (−x, −y)', end: 'Rotação de 180 graus em torno da origem.' },
    { letter: 'D', formula: '(x, y) → (x, −y)', end: 'Reflexão no eixo x.' }
  ];
  const states = definitions.map(() => ({ progress: 0, playing: false, started: false, lastTime: null, holdElapsed: 0 }));
  let frame = null;
  let hasPlayed = false;
  let views = [];
  const duration = 3000;
  const holdDuration = 900;
  const svgNS = 'http://www.w3.org/2000/svg';

  function pointAt(index, [x,y], progress) {
    if (index === 0) return [(1-progress)*x+progress*y, (1-progress)*y+progress*x];
    if (index === 3) return [x, (1-2*progress)*y];
    const angle = progress * (index === 1 ? Math.PI/2 : Math.PI);
    return [x*Math.cos(angle)-y*Math.sin(angle), x*Math.sin(angle)+y*Math.cos(angle)];
  }
  function svgElement(name, attributes, text) {
    const element = document.createElementNS(svgNS, name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    if (text !== undefined) element.textContent = text;
    return element;
  }
  definitions.forEach((definition, index) => {
    const panel = document.createElement('section');
    panel.className = 'el-panel';
    panel.setAttribute('aria-labelledby', `el-motion-title-${index}`);
    panel.innerHTML = `<h3 id="el-motion-title-${index}"><span class="el-letter">${definition.letter}</span><span class="el-formula">${definition.formula}</span></h3><svg class="el-canvas" role="img" aria-label="Alternativa ${definition.letter}. Objeto no primeiro quadrante, com a origem fixa."></svg><div class="el-panel-bottom"><span class="el-state" role="status" aria-live="polite">Posição inicial</span><button class="el-play cursor-interaction" type="button" aria-label="Reproduzir alternativa ${definition.letter}">Reproduzir ${definition.letter}</button></div>`;
    panelsHost.append(panel);
    const svg = panel.querySelector('svg');
    const structure = svgElement('g', {});
    const reference = svgElement('polygon', { class: 'el-reference' });
    const result = svgElement('polygon', { class: 'el-shape' });
    const tip = svgElement('circle', { class: 'el-tip', r: 3 });
    const landmark = svgElement('circle', { class: 'el-landmark', r: 2.5 });
    svg.append(structure, reference, result, tip, landmark);
    const button = panel.querySelector('button');
    views.push({ panel, svg, structure, reference, result, tip, landmark, button, label: panel.querySelector('.el-state'), width: 0, height: 0 });
    button.addEventListener('click', () => {
      const state = states[index];
      if (state.playing) { state.playing = false; state.lastTime = null; }
      else start(index);
      updateControls();
      
      requestFrame();
    });
  });
  function screenPoint(index, point) {
    const w = views[index].width;
    const h = views[index].height;
    const scale = (Math.min(w,h)-42)/8;
    return [w/2+point[0]*scale, h/2-point[1]*scale];
  }
  function polygon(index, points) { return points.map(point => screenPoint(index, point).join(',')).join(' '); }
  function draw(index) {
    const view = views[index];
    if (!view.width) return;
    const raw = states[index].progress;
    const t = raw*raw*(3-2*raw);
    view.reference.setAttribute('points', polygon(index, shape));
    view.result.setAttribute('points', polygon(index, shape.map(point => pointAt(index, point, t))));
    for (const [node, point] of [[view.tip,[3,1]], [view.landmark,[1.2,.85]]]) {
      const [x,y] = screenPoint(index, pointAt(index, point, t));
      node.setAttribute('cx', x);
      node.setAttribute('cy', y);
    }
  }
  function resize(index) {
    const view = views[index];
    const width = Math.max(180, view.svg.getBoundingClientRect().width);
    const height = Math.max(180, view.svg.getBoundingClientRect().height);
    if (width === view.width && height === view.height) return;
    view.width = width;
    view.height = height;
    view.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    view.structure.replaceChildren();
    for (let n=-4; n<=4; n++) {
      for (const points of [[[n,-4],[n,4]],[[-4,n],[4,n]]]) {
        const a = screenPoint(index,points[0]);
        const b = screenPoint(index,points[1]);
        view.structure.append(svgElement('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],class:n===0?'el-axis':'el-gridline'}));
      }
    }
    view.structure.append(
      svgElement('text',{x:screenPoint(index,[4,0])[0]+12,y:height/2-7,'text-anchor':'end',class:'el-axis-label'},'x'),
      svgElement('text',{x:width/2+8,y:16,class:'el-axis-label'},'y'),
      svgElement('text',{x:width/2-10,y:height/2+15,class:'el-axis-label'},'0')
    );
    draw(index);
  }
  function updateControls() {
    views.forEach((view,index) => {
      const state = states[index];
      const letter = definitions[index].letter;
      view.panel.dataset.playing = String(state.playing);
      const action = state.playing ? 'Pausar' : state.started && !motionPreference.matches ? 'Continuar' : 'Reproduzir';
      view.button.textContent = `${action} ${letter}`;
      view.button.setAttribute('aria-label', `${action} alternativa ${letter}`);
      const label = state.progress===1 ? 'Resultado' : state.playing ? 'Em movimento' : state.started ? 'Pausado' : 'Posição inicial';
      if (view.label.textContent !== label) view.label.textContent = label;
      view.svg.setAttribute('aria-label', `Alternativa ${letter}. ${state.progress===1 ? definitions[index].end : label+'.'} Contorno tracejado: posição inicial. Figura preenchida: transformação.`);
    });
    playAll.textContent = states.some(state => state.playing) ? 'Pausar todas' : hasPlayed && !motionPreference.matches ? 'Continuar todas' : 'Reproduzir todas';
  }
  function start(index) {
    const state = states[index];
    hasPlayed = true;
    state.started = true;
    state.lastTime = null;
    if (motionPreference.matches) { state.progress = 1; state.playing = false; draw(index); }
    else state.playing = true;
  }
  function requestFrame() {
    if (document.hidden || !states.some(state => state.playing)) {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      return;
    }
    if (frame === null) frame = requestAnimationFrame(tick);
  }
  function tick(time) {
    frame = null;
    if (document.hidden) { states.forEach(state => { state.lastTime = null; }); return; }
    let statusChanged = false;
    states.forEach((state,index) => {
      if (!state.playing) return;
      const elapsed = state.lastTime === null ? 0 : time - state.lastTime;
      state.lastTime = time;
      if (state.progress === 1) {
        state.holdElapsed += elapsed;
        if (state.holdElapsed >= holdDuration) {
          state.progress = 0;
          state.holdElapsed = 0;
          statusChanged = true;
        }
      } else {
        state.progress = Math.min(1, state.progress + elapsed / duration);
        if (state.progress === 1) { state.holdElapsed = 0; statusChanged = true; }
      }
      draw(index);
    });
    if (statusChanged) updateControls();
    requestFrame();
  }
  playAll.addEventListener('click', () => {
    if (states.some(state => state.playing)) states.forEach(state => { state.playing = false; state.lastTime = null; });
    else states.forEach((_,index) => start(index));
    updateControls();  requestFrame();
  });
  motionPreference.addEventListener('change', () => {
    if (motionPreference.matches) {
      states.forEach((state,index)=> { if (state.started) { state.playing=false; state.lastTime=null; state.holdElapsed=0; state.progress=1; draw(index); } });
      requestFrame();
    }
    updateControls();
  });
  document.addEventListener('visibilitychange', () => {
    states.forEach(state => { state.lastTime = null; });
    requestFrame();
  });
  const observer = new ResizeObserver(() => views.forEach((_,index)=>resize(index)));
  observer.observe(panelsHost);
  views.forEach((_,index)=>resize(index));
  updateControls();
})();
