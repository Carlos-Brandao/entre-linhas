(function () {
  'use strict';
  const registry = window.AlgebraLab;
  const S1 = 'var(--viz-series-1)', S2 = 'var(--viz-series-2)', S3 = 'var(--viz-series-3)';
  const FG = 'var(--foreground)', BORDER = 'var(--border)', MUTED = 'var(--muted-foreground)', BG = 'var(--background)';
  const sources = {
    simple: {label: 'NIST · mínimos quadrados', url: 'https://www.itl.nist.gov/div898/handbook/pmd/section1/pmd141.htm'},
    multiple: {label: 'scikit-learn · modelos lineares', url: 'https://scikit-learn.org/stable/modules/linear_model.html'},
    polynomial: {label: 'scikit-learn · subajuste e sobreajuste', url: 'https://scikit-learn.org/stable/auto_examples/model_selection/plot_underfitting_overfitting.html'}
  };
  const fmt = (v, p = 1) => Number(v).toLocaleString('pt-BR', {maximumFractionDigits: p, minimumFractionDigits: p});
  const seq = (n, fn) => Array.from({length: n}, (_, i) => fn(i));
  const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
  const rmse = (points, predict) => Math.sqrt(mean(points.map(p => (p.y - predict(p.x, p.z)) ** 2)));
  const noise = i => [0.7, -0.5, 0.2, -0.9, 0.5, 0.1, -0.4, 0.8, -0.2, 0.3, -0.7, 0.4][i % 12];
  const ease = t => t * t * (3 - 2 * t);
  const hot = s => `<span class="hot">${s}</span>`;
  const signed = (v, p) => (v < 0 ? '− ' : '+ ') + fmt(Math.abs(v), p);
  let chartId = 0;

  // Modified Gram–Schmidt with a second orthogonalization pass. The samples
  // are small and deterministic; polynomial inputs are scaled to [-1, 1].
  function leastSquares(rows, target) {
    const n = rows.length, p = rows[0].length;
    const q = [], r = seq(p, () => Array(p).fill(0));
    for (let j = 0; j < p; j++) {
      const v = rows.map(row => row[j]);
      for (let pass = 0; pass < 2; pass++) {
        for (let k = 0; k < j; k++) {
          const projection = v.reduce((s, x, i) => s + x * q[k][i], 0);
          r[k][j] += projection;
          for (let i = 0; i < n; i++) v[i] -= projection * q[k][i];
        }
      }
      r[j][j] = Math.hypot(...v);
      if (r[j][j] < 1e-10) throw new Error('Amostras insuficientes para este ajuste.');
      q[j] = v.map(x => x / r[j][j]);
    }
    const b = q.map(col => col.reduce((s, x, i) => s + x * target[i], 0));
    const coef = Array(p).fill(0);
    for (let j = p - 1; j >= 0; j--) {
      let value = b[j];
      for (let k = j + 1; k < p; k++) value -= r[j][k] * coef[k];
      coef[j] = value / r[j][j];
    }
    return coef;
  }
  function linear(points, multiple = false) {
    const coefficients = leastSquares(points.map(p => multiple ? [1, p.x, p.z] : [1, p.x]), points.map(p => p.y));
    return {coefficients, predict: (x, z = 0) => coefficients[0] + coefficients[1] * x + (coefficients[2] || 0) * z};
  }
  function polynomial(points, degree) {
    const extent = d3.extent(points, p => p.x), center = mean(extent), scale = (extent[1] - extent[0]) / 2 || 1;
    const features = x => seq(degree + 1, i => ((x - center) / scale) ** i);
    const coefficients = leastSquares(points.map(p => features(p.x)), points.map(p => p.y));
    return {coefficients, predict: x => features(x).reduce((sum, v, i) => sum + v * coefficients[i], 0)};
  }
  // Coefficients in the original units, only for display (degrees 1 and 2).
  const rawCoefficients = (points, degree) => leastSquares(points.map(p => seq(degree + 1, i => p.x ** i)), points.map(p => p.y));
  const blend = (from, to, t) => x => from(x) * (1 - t) + to(x) * t;
  function padded(values, fraction = 0.09) {
    const e = d3.extent(values.filter(Number.isFinite));
    const span = e[1] - e[0] || Math.max(Math.abs(e[0]), 1);
    return [e[0] - span * fraction, e[1] + span * fraction];
  }
  function label(api, svg, text, attrs = {}) {
    return api.el('text', {fill: FG, 'font-size': 14, ...attrs}, svg, text);
  }
  function frame(api, title, xlabel, ylabel, xdomain, ydomain, {top = 24, right = 18} = {}) {
    const {svg, w, h} = api.svg();
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', title);
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    api.el('title', {}, svg, title);
    const box = {left: 68, right: w - right, top, bottom: h - 56};
    const x = d3.scaleLinear().domain(xdomain).range([box.left + 8, box.right - 8]);
    const y = d3.scaleLinear().domain(ydomain).range([box.bottom - 8, box.top + 8]);
    api.el('rect', {x: box.left, y: box.top, width: box.right - box.left, height: box.bottom - box.top, fill: 'none', stroke: BORDER, 'data-chart-frame': ''}, svg);
    const gx = d3.select(svg).append('g').attr('transform', `translate(0,${box.bottom})`).call(d3.axisBottom(x).ticks(w < 420 ? 3 : 5).tickSize(4).tickFormat(d3.format('~g')));
    const gy = d3.select(svg).append('g').attr('transform', `translate(${box.left},0)`).call(d3.axisLeft(y).ticks(4).tickSize(4).tickFormat(d3.format('~g')));
    [gx, gy].forEach(g => {g.select('.domain').remove(); g.selectAll('line').attr('stroke', BORDER); g.selectAll('text').attr('fill', FG).attr('font-size', 13);});
    label(api, svg, xlabel, {class: 'axis-title', 'data-axis': 'x', x: (box.left + box.right) / 2, y: h - 12, 'text-anchor': 'middle'});
    label(api, svg, ylabel, {class: 'axis-title', 'data-axis': 'y', transform: `translate(17,${(box.top + box.bottom) / 2}) rotate(-90)`, 'text-anchor': 'middle'});
    const clipId = `regression-clip-${++chartId}`;
    const defs = api.el('defs', {}, svg), clip = api.el('clipPath', {id: clipId}, defs);
    api.el('rect', {x: box.left + 1, y: box.top + 1, width: box.right - box.left - 2, height: box.bottom - box.top - 2}, clip);
    const marks = api.el('g', {'clip-path': `url(#${clipId})`}, svg);
    return {svg, w, h, box, x, y, marks};
  }
  function preventTickCollisions(svg) {
    // Measure actual rendered labels; remove secondary ticks if space is tight.
    const labels = [...svg.querySelectorAll('.tick text')];
    const accepted = [...svg.querySelectorAll('.axis-title, .prediction-label')].map(node => node.getBoundingClientRect());
    labels.forEach(node => {
      const b = node.getBoundingClientRect();
      const collides = accepted.some(a => b.left < a.right + 4 && b.right + 4 > a.left && b.top < a.bottom + 4 && b.bottom + 4 > a.top);
      if (collides) node.parentNode.remove(); else accepted.push(b);
    });
  }
  function plot(api, options) {
    const {points, predict, xlabel, ylabel, title, selected, residuals = false, validation = [], showTrain = true, showValidation = true, hover = true, ghost = null, highlight = -1, references = []} = options;
    const all = [...points, ...validation];
    const xe = d3.extent([...all.map(p => p.x), ...(selected ? [selected.x] : [])]);
    const sample = fn => seq(121, i => ({x: xe[0] + (xe[1] - xe[0]) * i / 120, y: fn(xe[0] + (xe[1] - xe[0]) * i / 120)}));
    const curve = sample(predict);
    const bounds = [...all, ...curve, ...(selected ? [selected] : []), ...(options.bounds || [])];
    const c = frame(api, title, xlabel, ylabel, padded(bounds.map(p => p.x), 0.03), padded(bounds.map(p => p.y)), {top: options.top, right: options.right});
    const {svg, marks, x, y, box} = c;
    const line = d3.line().x(p => x(p.x)).y(p => y(p.y));
    references.forEach(ref => {
      api.el('path', {d: line(sample(ref.predict)), fill: 'none', stroke: MUTED, 'stroke-width': 1.5, 'stroke-dasharray': '2 5'}, marks);
      const end = xe[1];
      label(api, svg, ref.label, {x: Math.min(box.right - 6, x(end)), y: y(ref.predict(end)) - 8, 'text-anchor': 'end', fill: MUTED, 'font-size': 12});
    });
    if (ghost) api.el('path', {d: line(sample(ghost)), fill: 'none', stroke: MUTED, 'stroke-width': 2, 'stroke-dasharray': '6 5'}, marks);
    if (residuals && showTrain) points.forEach(p => api.el('line', {x1: x(p.x), x2: x(p.x), y1: y(p.y), y2: y(predict(p.x)), stroke: BORDER, 'stroke-width': 1.5}, marks));
    api.el('path', {d: line(curve), fill: 'none', stroke: S1, 'stroke-width': 3}, marks);
    if (showTrain) points.forEach((p, i) => api.el('circle', {cx: x(p.x), cy: y(p.y), r: i === highlight ? 8 : 5, fill: i === highlight ? S3 : S1, opacity: i === highlight ? 1 : 0.72}, marks));
    if (showValidation) validation.forEach(p => api.el('path', {d: `M${x(p.x)-5},${y(p.y)-5}l10,10m-10,0l10,-10`, stroke: S2, 'stroke-width': 2.5, fill: 'none'}, marks));
    if (selected) {
      api.el('line', {x1: x(selected.x), x2: x(selected.x), y1: box.bottom, y2: y(selected.y), stroke: FG, 'stroke-dasharray': '3 4', opacity: .55}, marks);
      if (options.horizontalGuide) api.el('line', {x1: box.left, x2: x(selected.x), y1: y(selected.y), y2: y(selected.y), stroke: FG, 'stroke-dasharray': '3 4', opacity: .55}, marks);
      api.el('circle', {cx:x(selected.x), cy:y(selected.y), r:options.selectedRadius || 7, fill:options.selectedColor || FG}, marks);
      if(options.selectedLabel) label(api,svg,options.selectedLabel,{class:'prediction-label',x:Math.max(box.left+35,Math.min(box.right-35,x(selected.x))),y:Math.max(box.top+16,y(selected.y)-16),'text-anchor':'middle'});
    }
    if (hover) addHover(api, c, options, xe);
    preventTickCollisions(svg);
    return c;
  }
  function addHover(api, c, options, xe) {
    const {points, predict, validation = [], showTrain = true, showValidation = true} = options;
    const {svg, marks, x, y, box} = c;
    // Exact-x model inspection stays local; it does not spam the live region.
    api.root.style.position = 'relative';
    const tooltip = api.htmlElement('div', {class: 'tooltip', role: 'tooltip'}, api.root);
    Object.assign(tooltip.style, {display: 'none', position: 'absolute', pointerEvents: 'none', zIndex: '2', maxWidth: '220px', background: 'var(--popover)', color: 'var(--popover-foreground)', padding: '6px 8px'});
    const guide = api.el('line', {y1: box.top, y2: box.bottom, stroke: BORDER, visibility: 'hidden', 'data-chart-hover-guide': ''}, marks);
    const hoverMark = api.el('circle', {r: 5, fill: S1, visibility: 'hidden', 'data-chart-hover-marker': 'ajuste'}, marks);
    const trainHover = validation.length ? api.el('circle', {r: 4, fill: 'var(--background)', stroke: S1, 'stroke-width': 2, visibility: 'hidden', 'data-chart-hover-marker': 'treino'}, marks) : null;
    const validationHover = validation.length ? api.el('path', {fill: 'none', stroke: S2, 'stroke-width': 2, visibility: 'hidden', 'data-chart-hover-marker': 'validacao'}, marks) : null;
    const interpolateSamples = (samples, value) => {
      if (value < samples[0].x || value > samples[samples.length-1].x) return null;
      const i = Math.max(1, Math.min(samples.length-1, d3.bisector(p => p.x).left(samples, value)));
      const a=samples[i-1], b=samples[i], t=(value-a.x)/(b.x-a.x);
      return a.y*(1-t)+b.y*t;
    };
    const overlay = api.el('rect', {x: x(xe[0]), y: box.top, width: x(xe[1]) - x(xe[0]), height: box.bottom - box.top, fill: 'transparent', 'data-chart-hit': '', 'data-chart-hover-overlay': 'cross-series'}, svg);
    let pinned = false;
    const inspect = event => {
      const [px] = d3.pointer(event, svg), value = x.invert(px), prediction = predict(value);
      guide.setAttribute('x1', x(value)); guide.setAttribute('x2', x(value)); guide.setAttribute('visibility', 'visible');
      hoverMark.setAttribute('cx', x(value)); hoverMark.setAttribute('cy', y(prediction)); hoverMark.setAttribute('visibility', 'visible');
      const rows = [`${fmt(value)} ${options.xunit || ''} → ${fmt(prediction)} ${options.yunit || ''} previstos`];
      if (validation.length) {
        const trainY=showTrain?interpolateSamples(points,value):null, valY=showValidation?interpolateSamples(validation,value):null;
        trainHover.setAttribute('visibility',trainY===null?'hidden':'visible');
        validationHover.setAttribute('visibility',valY===null?'hidden':'visible');
        if (trainY!==null) {trainHover.setAttribute('cx',x(value));trainHover.setAttribute('cy',y(trainY));rows.push(`Medidas anteriores: ${fmt(trainY)}%`);}
        if (valY!==null) {validationHover.setAttribute('d',`M${x(value)-4},${y(valY)-4}l8,8m-8,0l8,-8`);rows.push(`Novas medidas: ${fmt(valY)}%`);}
      }
      tooltip.textContent = rows.join(' · ');
      tooltip.style.display = 'block'; tooltip.style.left = `${Math.max(4, Math.min(x(value) + 10, c.w - 225))}px`; tooltip.style.top = '0px';
    };
    overlay.addEventListener('pointermove', event => {if (!pinned) inspect(event);});
    overlay.addEventListener('pointerleave', () => {if (!pinned) {tooltip.style.display = 'none'; guide.setAttribute('visibility', 'hidden'); hoverMark.setAttribute('visibility', 'hidden'); trainHover?.setAttribute('visibility','hidden'); validationHover?.setAttribute('visibility','hidden');}});
    overlay.addEventListener('click', event => {pinned = !pinned; inspect(event);});
  }
  function animateFit(api, from, to, render, done) {
    api.cancel();
    api.animate(550, t => render(blend(from, to, t)), () => {render(to); if (done) done();});
  }

  registry.register({
    id:'simples-transferencia',topic:'Regressão linear simples',title:'Quanto tempo para enviar o arquivo?',
    application:'O aplicativo prevê quanto tempo um arquivo levará para chegar à nuvem.',
    connection:'Regressão simples → usa o tamanho do arquivo para estimar o tempo.',source:sources.simple,
    mount(api){
      let size=75,progress=0;
      const points=seq(8,i=>({x:10+i*13,y:.35+(10+i*13)*.4+noise(i)*3})), model=linear(points), [b,a]=model.coefficients;
      const status=()=>api.status(`Arquivo maior, espera maior: ${fmt(size,0)} MB levam cerca de ${fmt(model.predict(size),0)} s nesta conexão.`);
      const draw=()=>{
        const total=model.predict(size);
        const c=plot(api,{title:'Tamanho do arquivo e tempo de envio',xlabel:'Arquivo (MB)',ylabel:'Tempo de envio (s)',xunit:'MB',yunit:'s',points,predict:model.predict,selected:{x:size,y:total},selectedLabel:`${fmt(total,0)} s`,bounds:[{x:0,y:0}],top:78,hover:false});
        const {svg,box}=c,bw=box.right-box.left;
        label(api,svg,`☁ Enviando arquivo de ${fmt(size,0)} MB`,{x:box.left,y:24});
        label(api,svg,`${fmt(total*progress,0)} s de ${fmt(total,0)} s`,{x:box.right,y:24,'text-anchor':'end'});
        api.el('rect',{x:box.left,y:36,width:bw,height:18,rx:9,fill:BORDER},svg);
        api.el('rect',{x:box.left,y:36,width:Math.max(18,bw*progress),height:18,rx:9,fill:S1},svg);
        api.math('a reta da regressão',`<p style="margin:0">tempo = a · MB + b</p><p class="muted" style="margin:0">a = ${fmt(a,2)} · b = ${fmt(b,2)}</p>`+
          `<p>${fmt(a,2)} · ${hot(fmt(size,0))} ${signed(b,2)} ≈ ${hot(fmt(total,0)+' s')}</p><p class="muted">A reta foi ajustada aos envios anteriores (pontos). Ela prevê qualquer tamanho novo.</p>`);
      };
      api.range('Tamanho do arquivo (MB)',10,100,5,size,v=>{size=v;draw();status();});
      api.onResize(draw);status();
      api.loop(2400,t=>{progress=t;draw();});
    }
  });

  registry.register({
    id:'simples-processamento',topic:'Regressão linear simples',title:'Quanto tempo para ler uma planilha?',
    application:'Um sistema prevê a espera antes de importar os registros de uma planilha.',
    connection:'Regressão simples → relaciona quantidade de registros e tempo de leitura.',source:sources.simple,
    mount(api){
      let extra=0,records=100;
      const pointsWith=delay=>seq(8,i=>({x:10+i*15,y:80+(10+i*15)*1.2+noise(i)*12+(i===7?delay:0)}));
      const normal=linear(pointsWith(0));
      const status=()=>api.status('Uma única leitura atrasada puxa a reta para cima e muda a previsão para todas as planilhas.');
      const draw=()=>{
        const points=pointsWith(extra),model=linear(points),[b,a]=model.coefficients,value=model.predict(records);
        plot(api,{title:'Quantidade de registros e tempo de leitura',xlabel:'Registros (mil)',ylabel:'Tempo de leitura (ms)',xunit:'mil registros',yunit:'ms',points,predict:model.predict,ghost:extra>1?normal.predict:null,highlight:extra>1?7:-1,selected:{x:records,y:value},selectedLabel:`${fmt(value,0)} ms`,bounds:[{x:10,y:80},{x:115,y:720}],hover:false});
        const [b0,a0]=normal.coefficients;
        api.math('coeficientes mudam com os dados',`<p style="margin:0">tempo = a · registros + b</p>`+
          api.matrix([[fmt(a0,2),fmt(b0,0)],[fmt(a,2),fmt(b,0)]],{rowLabels:['normal','agora'],colLabels:['a','b'],mark:i=>i&&extra>1?'on':''})+
          `<p>${fmt(records,0)} mil → ${hot(fmt(value,0)+' ms')}</p><p class="muted">Ponto roxo = leitura atrasada. Tracejado = reta sem ela.</p>`);
      };
      api.range('Registros na planilha (mil)',10,110,10,records,v=>{records=v;draw();});
      api.onResize(draw);status();
      api.loop(1500,t=>{extra=500*ease(t);draw();},{yoyo:true});
    }
  });

  registry.register({
    id:'simples-calibracao',topic:'Regressão linear simples',title:'Como o termômetro sabe a temperatura?',
    application:'O termômetro digital transforma um sinal elétrico em temperatura.',
    connection:'Regressão simples → liga o sinal do sensor à temperatura mostrada na tela.',source:sources.simple,
    mount(api){
      let reading=2;
      const points=seq(8,i=>({x:i*10,y:.7+.035*i*10+noise(i)*.025})),model=linear(points),[b,a]=model.coefficients;
      const temperature=()=> (reading-b)/a;
      const draw=()=>{
        const t=temperature();
        const c=plot(api,{title:'Sinal elétrico e temperatura',xlabel:'Temperatura (°C)',ylabel:'Sinal elétrico (V)',xunit:'°C',yunit:'V',points,predict:model.predict,selected:{x:t,y:reading},selectedLabel:`${fmt(t,0)} °C`,horizontalGuide:true,right:96,bounds:[{x:0,y:.6},{x:75,y:3.3}],hover:false});
        const {svg,box,w}=c,tx=w-52,top=box.top+10,bottom=box.bottom-26,level=Math.max(0,Math.min(1,t/75));
        api.el('rect',{x:tx-10,y:top,width:20,height:bottom-top,rx:10,fill:'none',stroke:FG,'stroke-width':1.5},svg);
        api.el('rect',{x:tx-5,y:bottom-(bottom-top-6)*level,width:10,height:(bottom-top-6)*level+4,rx:5,fill:S1},svg);
        api.el('circle',{cx:tx,cy:bottom+12,r:16,fill:S1,stroke:FG,'stroke-width':1.5},svg);
        label(api,svg,`${fmt(t,0)} °C`,{x:tx,y:box.top-4,'text-anchor':'middle'});
        api.math('ler a reta ao contrário',`<p style="margin:0">V = a · T + b</p><p class="muted" style="margin:0">a = ${fmt(a,3)} · b = ${fmt(b,2)}</p>`+
          `<p>T = (V − b) / a</p><p>= (${hot(fmt(reading,2))} ${signed(-b,2)}) / ${fmt(a,3)}</p><p>≈ ${hot(fmt(t,1)+' °C')}</p><p class="muted">Arraste o sinal para controlar.</p>`);
      };
      const status=()=>api.status('O termômetro só mede volts. A reta ajustada nas medidas de fábrica converte o sinal em graus.');
      const input=api.range('Sinal do sensor (V)',.9,3.1,.05,reading,v=>{api.cancel();reading=v;draw();});
      api.onResize(draw);status();
      api.loop(2200,t=>{reading=.9+2.2*ease(t);input.value=reading;if(input.previousElementSibling)input.previousElementSibling.textContent=fmt(reading,2);draw();},{yoyo:true});
    }
  });

  const apiSamples=seq(24,i=>{const x=50+(i%6)*90,z=20+Math.floor(i/6)*60;return{x,z,y:24+.075*x+.18*z+noise(i)*3};});
  function multipleMath(api,model,names,values,unit,result){
    const [b0,b1,b2]=model.coefficients;
    return `<p style="margin:0">ŷ = b + w₁·${names[0]} + w₂·${names[1]}</p>`+
      api.matrix([[fmt(b0,2),fmt(b1,3),fmt(b2,3)]],{colLabels:['b','w₁','w₂']})+
      `<p>${fmt(b0,1)} + ${fmt(b1,3)}·${hot(fmt(values[0],0))} + ${fmt(b2,3)}·${hot(fmt(values[1],0))}</p><p>≈ ${hot(fmt(result,0)+' '+unit)}</p>`+
      '<p class="muted">b é a base; cada w é o peso de uma variável. Somadas, as contribuições dão a previsão.</p>';
  }
  registry.register({
    id:'multipla-api',topic:'Regressão linear múltipla',title:'Por que o aplicativo ficou lento?',
    application:'O servidor prevê a espera ao combinar dados enviados e pessoas usando o aplicativo.',
    connection:'Regressão múltipla → combina tamanho dos dados e número de usuários.',source:sources.multiple,
    mount(api){
      const model=linear(apiSamples,true);let payload=300,users=80,shownUsers=80;
      const draw=()=>{const predict=x=>model.predict(x,shownUsers);plot(api,{title:'Tempo de resposta do aplicativo',xlabel:'Dados enviados (KB)',ylabel:'Espera (ms)',xunit:'KB',yunit:'ms',points:apiSamples,predict,showTrain:false,references:[{label:'20 pessoas',predict:x=>model.predict(x,20)},{label:'200 pessoas',predict:x=>model.predict(x,200)}],selected:{x:payload,y:predict(payload)},selectedLabel:`${fmt(predict(payload),0)} ms`,bounds:[{x:50,y:model.predict(50,20)},{x:500,y:model.predict(500,200)}]});
        api.math('duas variáveis, uma conta',multipleMath(api,model,['KB','pessoas'],[payload,shownUsers],'ms',model.predict(payload,shownUsers)));};
      const status=()=>api.status(`Com ${users} pessoas e ${payload} KB, a resposta leva cerca de ${fmt(model.predict(payload,users),0)} ms. Mais pessoas sobem a reta inteira.`);
      api.range('Dados enviados (KB)',50,500,10,payload,v=>{api.cancel();payload=v;shownUsers=users;draw();status();});
      api.range('Pessoas usando o app',20,200,10,users,v=>{const from=shownUsers;users=v;api.animate(350,t=>{shownUsers=from+(users-from)*t;draw();},()=>{shownUsers=users;draw();status();});});
      api.onResize(draw);draw();status();
    }
  });

  const renderSamples=seq(24,i=>{const x=100+(i%6)*160,z=1+Math.floor(i/6)*4;return{x,z,y:2.3+.012*x+.52*z+noise(i)*.2};});
  registry.register({
    id:'multipla-render',topic:'Regressão linear múltipla',title:'Mais detalhes deixam o jogo pesado?',
    application:'O jogo estima o tempo de desenhar a cena conforme você adiciona objetos e luzes.',
    connection:'Regressão múltipla → combina objetos e luzes para prever o desempenho.',source:sources.multiple,
    mount(api){
      const model=linear(renderSamples,true);let objects=400,lights=6,shownObjects=400,shownLights=6;
      const draw=()=>{
        const values=[model.coefficients[0],model.coefficients[1]*shownObjects,model.coefficients[2]*shownLights,model.predict(shownObjects,shownLights)],names=['Base','Objetos','Luzes','Cena toda'];
        const {svg,w,h}=api.svg();svg.setAttribute('aria-label','Tempo previsto para desenhar o jogo');
        const left=88,right=w-18,top=30,bottom=h-56,drawable=right-left-6;
        const domainMax=Math.max(model.predict(900,13),1000/60)*drawable/(drawable-70);
        const x=d3.scaleLinear().domain([0,domainMax]).range([left+3,right-3]);
        const y=d3.scaleBand().domain(names).range([top+12,bottom-8]).padding(.45);
        api.el('rect',{x:left,y:top,width:right-left,height:bottom-top,fill:'none',stroke:BORDER,'data-chart-frame':''},svg);
        const ax=d3.select(svg).append('g').attr('transform',`translate(0,${bottom})`).call(d3.axisBottom(x).ticks(w<420?3:5).tickSize(4));ax.select('.domain').remove();ax.selectAll('line').attr('stroke',BORDER);ax.selectAll('text').attr('fill',FG).attr('font-size',13);
        const over=values[3]>1000/60;
        names.forEach((name,i)=>{const value=values[i];label(api,svg,name,{x:left-8,y:y(name)+y.bandwidth()/2+5,'text-anchor':'end'});api.el('rect',{x:x(0),y:y(name),width:Math.max(0,x(value)-x(0)),height:y.bandwidth(),rx:3,fill:i===3&&over?S3:S1,opacity:i===3?1:.45},svg);label(api,svg,`${fmt(value)} ms`,{x:x(value)+6,y:y(name)+y.bandwidth()/2+5});});
        api.el('line',{x1:x(1000/60),x2:x(1000/60),y1:top,y2:bottom,stroke:FG,'stroke-dasharray':'3 4',opacity:.55},svg);
        label(api,svg,'Meta: 60 fps',{x:x(1000/60),y:top-9,'text-anchor':'middle'});
        label(api,svg,'Tempo para desenhar (ms)',{class:'axis-title','data-axis':'x',x:(left+right)/2,y:h-12,'text-anchor':'middle'});
        preventTickCollisions(svg);
        api.math('soma de efeitos',multipleMath(api,model,['obj','luzes'],[shownObjects,shownLights],'ms',values[3])+`<p>${over?'Passou de 16,7 ms: o jogo fica abaixo de 60 fps.':'Abaixo de 16,7 ms: 60 fps garantidos.'}</p>`);
      };
      const status=()=>api.status(`Objetos e luzes somam trabalho: esta cena permite cerca de ${fmt(1000/model.predict(objects,lights),0)} quadros por segundo.`);
      const change=()=>{const fromObjects=shownObjects,fromLights=shownLights;api.animate(350,t=>{shownObjects=fromObjects+(objects-fromObjects)*t;shownLights=fromLights+(lights-fromLights)*t;draw();},()=>{draw();status();});};
      api.range('Objetos na cena',100,900,25,objects,v=>{objects=v;change();});
      api.range('Luzes na cena',1,13,1,lights,v=>{lights=v;change();});
      api.onResize(draw);draw();status();
    }
  });

  const powerSamples=seq(25,i=>{const x=(i%5)*25,z=4+Math.floor(i/5)*7;return{x,z,y:35+.65*x+1.1*z+noise(i)*1.2};});
  registry.register({
    id:'multipla-potencia',topic:'Regressão linear múltipla',title:'Quanto o computador está consumindo?',
    application:'O computador estima o consumo elétrico conforme processador e memória trabalham.',
    connection:'Regressão múltipla → combina o uso de processador e memória.',source:sources.multiple,
    mount(api){
      const model=linear(powerSamples,true);let cpu=50,ram=16,shownCpu=50;let cpuInput,ramInput;
      const status=()=>api.status(`Com ${cpu}% do processador e ${ram} GB de memória, o consumo previsto é ${fmt(model.predict(cpu,ram),0)} W. Clique no mapa para escolher outro ponto.`);
      const draw=()=>{
        const cells=seq(11,i=>seq(8,j=>({x:i*10,z:4+j*4,y:model.predict(i*10,4+j*4)}))).flat();
        const c=frame(api,'Consumo do computador por processador e memória','Processador (%)','Memória usada (GB)',padded(cells.map(p=>p.x),.02),padded(cells.map(p=>p.z),.03),{top:30});
        const {svg,marks,x,y,box}=c,opacity=d3.scaleLinear().domain(d3.extent(cells,p=>p.y)).range([.12,.88]);
        const cw=x(10)-x(0),ch=Math.abs(y(8)-y(4));
        cells.forEach(p=>api.el('rect',{x:x(p.x)-cw/2,y:y(p.z)-ch/2,width:cw+.2,height:ch+.2,fill:S1,opacity:opacity(p.y)},marks));
        const sx=x(shownCpu),sy=y(ram);api.el('circle',{cx:sx,cy:sy,r:10,fill:BG,stroke:FG,'stroke-width':2},marks);api.el('circle',{cx:sx,cy:sy,r:3,fill:FG},marks);
        label(api,svg,'Mais cor = mais consumo',{x:box.left,y:20});
        label(api,svg,`${fmt(model.predict(shownCpu,ram),0)} W`,{x:Math.max(box.left+34,Math.min(box.right-34,sx)),y:Math.max(box.top+16,sy-16),'text-anchor':'middle'});
        const overlay=api.el('rect',{x:box.left,y:box.top,width:box.right-box.left,height:box.bottom-box.top,fill:'transparent','data-chart-hit':''},svg);
        overlay.addEventListener('click',event=>{api.cancel();const p=d3.pointer(event,svg);cpu=shownCpu=Math.max(0,Math.min(100,Math.round(x.invert(p[0])/5)*5));ram=Math.max(4,Math.min(32,Math.round(y.invert(p[1]))));cpuInput.value=cpu;ramInput.value=ram;cpuInput.dispatchEvent(new Event('input',{bubbles:true}));ramInput.dispatchEvent(new Event('input',{bubbles:true}));});
        preventTickCollisions(svg);
        api.math('duas variáveis, uma conta',multipleMath(api,model,['CPU','RAM'],[shownCpu,ram],'W',model.predict(shownCpu,ram)));
      };
      cpuInput=api.range('Processador em uso (%)',0,100,5,cpu,v=>{const from=shownCpu;cpu=v;api.animate(300,t=>{shownCpu=from+(cpu-from)*t;draw();},()=>{shownCpu=cpu;draw();status();});});
      ramInput=api.range('Memória usada (GB)',4,32,1,ram,v=>{api.cancel();ram=v;shownCpu=cpu;draw();status();});
      api.onResize(draw);draw();status();
    }
  });

  function polyMath(api,points,degree,variable,value,result,unit){
    const c=rawCoefficients(points,degree),digits=v=>Math.abs(v)<.01?5:2;
    const formula=degree===1?`ŷ = a + b·${variable}`:`ŷ = a + b·${variable} + c·${variable}²`;
    return `<p style="margin:0">${formula}</p>`+api.matrix([c.map(v=>fmt(v,digits(v)))],{colLabels:['a','b','c'].slice(0,degree+1)})+
      `<p>${variable} = ${hot(fmt(value,variable==='t'?1:0))} → ${hot(fmt(result,0)+' '+unit)}</p>`+
      `<p class="muted">${degree===1?'Só reta: sem o termo ao quadrado, ela não dobra.':'O termo ao quadrado (c) é o que dobra a curva.'}</p>`;
  }
  registry.register({
    id:'polinomial-trajetoria',topic:'Regressão polinomial',title:'Por onde a bola vai passar?',
    application:'Um rastreador de vídeo usa as posições vistas pela câmera para prever o caminho da bola.',
    connection:'Regressão polinomial → usa uma curva para acompanhar a subida e a descida.',source:sources.polynomial,
    mount(api){
      const points=seq(9,i=>{const x=i*.3;return{x,y:30+150*x-58*x*x+noise(i)*6};});
      let degree=2,time=0,model=polynomial(points,degree);
      const draw=()=>{const y=model.predict(time);plot(api,{title:'Caminho previsto para a bola',xlabel:'Tempo do vídeo (s)',ylabel:'Altura na tela (px)',xunit:'s',yunit:'px',points,predict:model.predict,selected:{x:time,y},selectedLabel:`${fmt(y,0)} px`,selectedRadius:11,selectedColor:'var(--viz-series-3)',bounds:[{x:0,y:0},{x:2.4,y:140}],hover:false});
        api.math('curva de grau '+degree,polyMath(api,points,degree,'t',time,y,'px'));};
      const status=()=>api.status(degree===2?'A curva acompanha a subida e a descida da bola.':'Uma reta perde a curva do movimento: a bola sai da linha prevista.');
      api.select('Caminho previsto',[{value:'1',label:'Reta'},{value:'2',label:'Curva simples'}],'2',v=>{degree=+v;model=polynomial(points,degree);status();play();});
      function play(){api.loop(2400,t=>{time=t*2.4;draw();});}
      api.onResize(draw);status();play();
    }
  });

  registry.register({
    id:'polinomial-sensor',topic:'Regressão polinomial',title:'O robô está perto do obstáculo?',
    application:'Um robô transforma o sinal de um sensor em distância até o objeto à frente.',
    connection:'Regressão polinomial → traduz um sensor cuja resposta segue uma curva.',source:sources.polynomial,
    mount(api){
      const points=seq(9,i=>{const x=100+i*95;return{x,y:12+120*(1-x/1023)**2+noise(i)*1.4};});
      let degree=2,reading=520,shownReading=520,model=polynomial(points,degree);
      const draw=(predict=model.predict)=>{plot(api,{title:'Sinal do sensor e distância até o obstáculo',xlabel:'Sinal digital (un.)',ylabel:'Distância (cm)',xunit:'un.',yunit:'cm',points,predict,selected:{x:shownReading,y:predict(shownReading)},selectedLabel:`${fmt(predict(shownReading),0)} cm`});
        api.math('curva de grau '+degree,polyMath(api,points,degree,'s',shownReading,predict(shownReading),'cm'));};
      const status=()=>api.status(`O robô estima um obstáculo a ${fmt(model.predict(reading),0)} cm${degree===1?'; a reta se afasta das medidas':'; a curva acompanha as medidas'}.`);
      api.select('Como prever a distância',[{value:'1',label:'Reta'},{value:'2',label:'Curva simples'}],'2',v=>{const before=model.predict;degree=+v;model=polynomial(points,degree);animateFit(api,before,model.predict,draw,status);});
      api.range('Sinal recebido pelo sensor',100,860,10,reading,v=>{const from=shownReading;reading=v;api.animate(300,t=>{shownReading=from+(reading-from)*t;draw();},()=>{shownReading=reading;draw();status();});});
      api.onResize(()=>draw());draw();status();
    }
  });

  registry.register({
    id:'polinomial-bateria',topic:'Regressão polinomial',title:'Uma curva complicada prevê melhor?',
    application:'O celular usa medidas anteriores para prever quanta bateria restará durante o uso.',
    connection:'Regressão polinomial → curvas mais complicadas nem sempre fazem previsões melhores.',source:sources.polynomial,
    mount(api){
      const truth=x=>100-5*x-.42*x*x;
      const train=seq(10,i=>({x:i*.8,y:truth(i*.8)+[0,-3,4,-4,2,4,-3,3,-4,2][i]}));
      const validation=seq(17,i=>({x:.2+i*.425,y:truth(.2+i*.425)+noise(i)*.7}));
      let degree=2,model=polynomial(train,degree),showValidation=false;
      const draw=(predict=model.predict)=>{const c=plot(api,{title:'Previsão de bateria e novas medidas',xlabel:'Tempo de uso (h)',ylabel:'Bateria restante (%)',xunit:'h',yunit:'%',points:train,validation,predict,showValidation});label(api,c.svg,showValidation?'● Anteriores   × Novas medidas':'● Medidas anteriores',{x:c.box.left,y:16});
        const oldError=rmse(train,model.predict),newError=rmse(validation,model.predict);
        api.math('grau '+degree+' · '+(degree+1)+' coeficientes',`<p style="margin:0">${degree===1?'ŷ = a + b·h':degree===2?'ŷ = a + b·h + c·h²':'ŷ = a + b·h + … + j·h⁹'}</p>`+
          api.matrix([[fmt(oldError,1),showValidation?fmt(newError,1):'?']],{colLabels:['antigas','novas'],mark:(_,j)=>j&&showValidation?'on':''})+
          `<p class="muted">Erro médio (pontos de %). ${degree===9?'Erro quase zero nas antigas não garante acerto nas novas.':'Mais coeficientes nem sempre reduzem o erro nas novas.'}</p>`);};
      const status=()=>api.status(degree===9?(showValidation?'A curva exagerada passa pelas medidas antigas, mas se afasta das novas.':'A curva exagerada passa por todos os pontos; veja se acerta as próximas medidas.'):(degree===1?'A bateria não cai sempre no mesmo ritmo: uma reta simplifica demais.':(showValidation?'A curva simples acompanha melhor as novas medidas de bateria.':'A curva simples prevê cerca de '+fmt(model.predict(5),0)+'% de bateria após 5 horas.')));
      api.select('Formato da previsão',[{value:'1',label:'Reta'},{value:'2',label:'Curva simples'},{value:'9',label:'Curva exagerada'}],'2',v=>{const before=model.predict;degree=+v;model=polynomial(train,degree);animateFit(api,before,model.predict,draw,status);});
      const reveal=api.button('Revelar novas medidas',()=>{showValidation=!showValidation;reveal.textContent=showValidation?'Ocultar novas medidas':'Revelar novas medidas';reveal.setAttribute('aria-pressed',String(showValidation));draw();status();},{primary:true});reveal.setAttribute('aria-pressed','false');
      api.onResize(()=>draw());draw();status();
    }
  });

  registry.regressionMath={leastSquares,linear,polynomial,rmse};
})();
