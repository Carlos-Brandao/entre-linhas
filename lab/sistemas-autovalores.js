(() => {
  const ink='var(--foreground)', border='var(--border)', accent='var(--viz-series-1)', other='var(--viz-series-2)', third='var(--viz-series-3, #9d7dff)', bg='var(--background)', muted='var(--muted-foreground)';
  const fmt=(v,d=2)=>Number(v).toLocaleString('pt-BR',{maximumFractionDigits:d});
  function text(api,svg,x,y,label,extra={}) {return api.el('text',{x,y,fill:ink,'font-size':14,...extra},svg,label);}
  function line(api,svg,a,b,attrs={}) {return api.el('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:border,'stroke-width':1.5,...attrs},svg);}
  function arrowHead(api,svg,id,color) {const defs=api.el('defs',{},svg);const m=api.el('marker',{id,viewBox:'0 0 8 8',refX:7,refY:4,markerWidth:7,markerHeight:7,orient:'auto'},defs);api.el('path',{d:'M 0 0 L 8 4 L 0 8 Z',fill:color},m);}
  // Plane with x in [x0,x1] and y in [y0,y1]; returns a point mapper.
  function plane(api,svg,w,h,[x0,x1],[y0,y1],{pad=44,top=40,bottom=40,labels=null,square=false}={}) {
    let sx=(w-2*pad)/(x1-x0), sy=(h-top-bottom)/(y1-y0);
    if(square){const s=Math.min(sx,sy);sx=sy=s;}
    const ox=(w-(x1-x0)*sx)/2-x0*sx, oy=top+(y1)*sy;
    const P=(x,y)=>[ox+x*sx,oy-y*sy];
    line(api,svg,P(x0,0),P(x1,0),{stroke:border});line(api,svg,P(0,y0),P(0,y1),{stroke:border});
    if(labels){text(api,svg,P(x1,0)[0],P(x1,0)[1]+20,labels[0],{'text-anchor':'end',fill:muted,'font-size':12});text(api,svg,P(0,y1)[0]+8,P(0,y1)[1]+4,labels[1],{fill:muted,'font-size':12});}
    return P;
  }
  function vec(api,svg,P,[x,y],color,id,extra={}) {return line(api,svg,P(0,0),P(x,y),{stroke:color,'stroke-width':3,'marker-end':`url(#${id})`,...extra});}

  // ---------- Sistemas lineares ----------
  window.AlgebraLab.register({
    id:'sistemas-retas',topic:'Sistemas lineares',title:'Dois pedidos revelam os preços',
    application:'A lanchonete só guardou o total de dois pedidos. Com eles, dá para descobrir o preço do hambúrguer e do suco.',
    connection:'Cada pedido é uma equação; a solução do sistema é o ponto onde as duas retas se cruzam. Se o determinante é zero, não há resposta única.',
    source:{label:'Referência · sistemas lineares',url:'https://numpy.org/doc/stable/reference/generated/numpy.linalg.solve.html'},
    mount(api){
      const H=11,S=4;let c=3,progress=0;
      api.range('Sucos no 2º pedido',0,5,1,c,v=>{c=v;update();play();});
      function update(){const det=2*c-4;api.status(det===0?'O 2º pedido é o 1º em dobro: as retas se sobrepõem e o sistema não tem solução única.':`As retas se cruzam em um só ponto: hambúrguer R$ ${H}, suco R$ ${S}.`);}
      function play(){api.loop(1600,p=>{progress=p;draw();});}
      function draw(){
        const {svg,w,h}=api.svg();const t2=4*H+c*S,det=2*c-4;
        const P=plane(api,svg,w,h,[0,16],[0,30],{labels:['hambúrguer (R$)','suco (R$)']});
        text(api,svg,w/2,22,det===0?'Retas sobrepostas → infinitas soluções':'Cada pedido vira uma reta',{'text-anchor':'middle'});
        const end=Math.max(.02,progress);
        // Pedido 1: 2h + 1s = 26  → s = 26 − 2h
        const l1=h0=>[h0,26-2*h0];
        const a=l1(0),b=l1(13);line(api,svg,P(...a),P(a[0]+(b[0]-a[0])*end,a[1]+(b[1]-a[1])*end),{stroke:other,'stroke-width':3});
        // Pedido 2: 4h + c·s = t2
        if(c===0){const x=t2/4;line(api,svg,P(x,0),P(x,30*end),{stroke:accent,'stroke-width':3,'stroke-dasharray':det===0?'7 6':null});}
        else{const s0=t2/c,h1=Math.min(16,t2/4),s1=(t2-4*h1)/c;const A=[0,Math.min(30,s0)];const hA=s0>30?(t2-30*c)/4:0;A[0]=hA;line(api,svg,P(A[0],A[1]),P(A[0]+(h1-A[0])*end,A[1]+(s1-A[1])*end),{stroke:accent,'stroke-width':3,'stroke-dasharray':det===0?'7 6':null});}
        text(api,svg,w-24,52,'pedido 1: 2h + 1s = 26',{fill:other,'font-size':13,'text-anchor':'end'});
        text(api,svg,w-24,72,`pedido 2: 4h + ${c}s = ${t2}`,{fill:accent,'font-size':13,'text-anchor':'end'});
        if(det!==0&&progress>.6){const [x,y]=P(H,S);api.el('circle',{cx:x,cy:y,r:8*Math.min(1,(progress-.6)/.3)+1,fill:accent},svg);text(api,svg,x+12,y-10,`(${H}, ${S})`,{'font-size':13});}
        api.math('sistema 2×2',api.matrix([[2,1,26],[4,c,t2]],{colLabels:['h','s','total']})+
          `<p>det = 2·${c} − 1·4 = <span class="hot">${det}</span></p>`+
          (det===0?'<p>det = 0: as equações dizem a mesma coisa. Falta informação.</p>':`<p>det ≠ 0 → solução única:<br>h = ${H}, s = ${S}</p>`));
      }
      api.onResize(draw);update();play();
    }
  });

  const items=['café','pão','sanduíche'];
  const orders=[[1,2,1],[2,1,1],[1,1,2]];
  function gaussSteps(price){
    const b=orders.map(r=>r.reduce((s,v,i)=>s+v*price[i],0));
    let M=orders.map((r,i)=>[...r,b[i]]);const steps=[{M:M.map(r=>r.slice()),op:'Matriz aumentada: uma linha por nota fiscal',row:-1}];
    const sub=(t,s,f,label)=>{M=M.map(r=>r.slice());M[t]=M[t].map((v,j)=>v-f*M[s][j]);steps.push({M:M.map(r=>r.slice()),op:label,row:t});};
    sub(1,0,2,'L2 ← L2 − 2·L1  (zera o café da nota 2)');
    sub(2,0,1,'L3 ← L3 − L1  (zera o café da nota 3)');
    sub(2,1,M[2][1]/M[1][1],'L3 ← L3 − ⅓·L2  (zera o pão da nota 3)');
    const z=M[2][3]/M[2][2],y=(M[1][3]-M[1][2]*z)/M[1][1],x=M[0][3]-M[0][1]*y-M[0][2]*z;
    steps.push({M,op:`Substituição de trás para frente: sanduíche = ${fmt(z)}`,row:2,sol:[null,null,z]});
    steps.push({M,op:`Pão = ${fmt(y)}`,row:1,sol:[null,y,z]});
    steps.push({M,op:`Café = ${fmt(x)}`,row:0,sol:[x,y,z]});
    return {steps,b};
  }
  window.AlgebraLab.register({
    id:'sistemas-gauss',topic:'Sistemas lineares',title:'Três notas fiscais, três preços',
    application:'Um app de controle de gastos descobre o preço de cada item só com os totais de três notas fiscais.',
    connection:'A eliminação gaussiana zera os coeficientes abaixo da diagonal; depois, a substituição de trás para frente revela cada incógnita.',
    source:{label:'Referência · eliminação gaussiana',url:'https://numpy.org/doc/stable/reference/generated/numpy.linalg.solve.html'},
    mount(api){
      const options=[[4,6,10],[5,3,12],[3,7,8]];let k=0,data=gaussSteps(options[0]),progress=0;
      api.button('Trocar os preços',()=>{k=(k+1)%options.length;data=gaussSteps(options[k]);play();},{primary:true});
      function play(){api.loop(data.steps.length*1100,p=>{progress=p;draw();});}
      function draw(){
        const {svg,w,h}=api.svg();const n=Math.min(data.steps.length-1,Math.floor(progress*data.steps.length));const st=data.steps[n];
        text(api,svg,w/2,24,`Passo ${n+1} de ${data.steps.length}`,{'text-anchor':'middle',fill:muted,'font-size':13});
        const cw=Math.min(78,(w-60)/4.6),rh=46,x0=(w-cw*4.3)/2,y0=70;
        ['café','pão','sand.','total'].forEach((l,j)=>text(api,svg,x0+cw*(j+.5)+(j===3?cw*.3:0),y0-14,l,{'text-anchor':'middle',fill:muted,'font-size':12}));
        api.el('path',{d:`M${x0+8} ${y0}H${x0}V${y0+rh*3}H${x0+8}M${x0+cw*4.3-8} ${y0}H${x0+cw*4.3}V${y0+rh*3}H${x0+cw*4.3-8}`,fill:'none',stroke:ink,'stroke-width':1.5},svg);
        line(api,svg,[x0+cw*3.15,y0+4],[x0+cw*3.15,y0+rh*3-4],{'stroke-dasharray':'3 4'});
        st.M.forEach((r,i)=>{if(i===st.row)api.el('rect',{x:x0+4,y:y0+i*rh+4,width:cw*4.3-8,height:rh-8,rx:8,fill:accent,'fill-opacity':.14},svg);
          r.forEach((v,j)=>{const lower=j<i&&j<3;text(api,svg,x0+cw*(j+.5)+(j===3?cw*.3:0),y0+i*rh+rh/2+5,fmt(v),{'text-anchor':'middle','font-size':16,fill:lower&&Math.abs(v)<1e-9?accent:ink,'font-family':'JetBrains Mono, monospace'});});});
        text(api,svg,w/2,y0+rh*3+40,st.op,{'text-anchor':'middle','font-size':14,fill:accent});
        if(st.sol){const s=st.sol.map((v,i)=>v===null?`${items[i]} = ?`:`${items[i]} = R$ ${fmt(v)}`).join('   ·   ');text(api,svg,w/2,y0+rh*3+70,s,{'text-anchor':'middle','font-size':13});}
        api.status(`Notas: ${orders.map((r,i)=>`${r[0]} café + ${r[1]} pão + ${r[2]} sanduíche = R$ ${data.b[i]}`).join(' | ')}`);
        api.math('eliminação gaussiana',`<p>Objetivo: deixar a matriz <span class="hot">triangular</span> (zeros abaixo da diagonal).</p><p>${st.op}</p><p class="muted">Operações entre linhas não mudam a solução do sistema.</p>`);
      }
      api.onResize(draw);play();
    }
  });

  window.AlgebraLab.register({
    id:'sistemas-gauss-seidel',topic:'Sistemas lineares',title:'Chutar e corrigir: Gauss-Seidel',
    application:'Um simulador estima a temperatura ao longo de uma barra aquecida corrigindo um palpite a cada rodada, como fazem programas de engenharia com milhares de equações.',
    connection:'Cada ponto obedece a uma equação: sua temperatura é a média dos vizinhos. Gauss-Seidel resolve o sistema aos poucos, usando sempre o valor mais novo.',
    source:{label:'Referência · métodos iterativos',url:'https://en.wikipedia.org/wiki/Gauss%E2%80%93Seidel_method'},
    mount(api){
      let right=20,progress=0;const N=6,ITER=30;
      api.range('Temperatura da ponta direita (°C)',0,100,5,right,v=>{right=v;play();});
      function history(){const T=[100,0,0,0,0,right];const hs=[T.slice()];for(let k=0;k<ITER;k++){for(let i=1;i<N-1;i++)T[i]=(T[i-1]+T[i+1])/2;hs.push(T.slice());}return hs;}
      function play(){api.loop(4200,p=>{progress=p;draw();});}
      function draw(){
        const hs=history(),k=Math.min(ITER,Math.floor(progress*ITER)),T=hs[k],exact=Array.from({length:N},(_,i)=>100+(right-100)*i/(N-1));
        const err=Math.max(...T.map((v,i)=>Math.abs(v-exact[i])));
        const {svg,w,h}=api.svg();text(api,svg,w/2,24,`Rodada ${k} · maior erro ${fmt(err,1)} °C`,{'text-anchor':'middle'});
        const left=40,bw=(w-80)/N,base=h-60,scale=(h-130)/100;
        exact.forEach((v,i)=>line(api,svg,[left+bw*i+6,base-v*scale],[left+bw*(i+1)-6,base-v*scale],{stroke:muted,'stroke-dasharray':'4 4'}));
        T.forEach((v,i)=>{const fixed=i===0||i===N-1;api.el('rect',{x:left+bw*i+8,y:base-v*scale,width:bw-16,height:Math.max(1,v*scale),rx:6,fill:fixed?other:accent,'fill-opacity':fixed?.55:.8},svg);text(api,svg,left+bw*(i+.5),base-v*scale-8,`${fmt(v,0)}°`,{'text-anchor':'middle','font-size':12});text(api,svg,left+bw*(i+.5),base+20,fixed?'ponta':`T${i}`,{'text-anchor':'middle',fill:muted,'font-size':12});});
        text(api,svg,w/2,h-12,'tracejado = solução exata',{'text-anchor':'middle',fill:muted,'font-size':12});
        api.status(k===0?'Palpite inicial: tudo a 0 °C no meio da barra.':err<.5?'O palpite já praticamente coincide com a solução exata.':'A cada rodada, cada ponto vira a média dos vizinhos e o erro diminui.');
        api.math('Gauss-Seidel',`<p>Tᵢ ← (Tᵢ₋₁ + Tᵢ₊₁) / 2</p><p>Rodada ${k}:<br>${T.slice(1,-1).map((v,i)=>`T${i+1} = ${fmt(v,1)}`).join('<br>')}</p><p class="muted">Usa o valor recém-calculado do vizinho na mesma rodada.</p>`);
      }
      api.onResize(draw);play();
    }
  });

  // ---------- Autovalores e autovetores ----------
  const matrices={
    diagonal:{start:Math.PI/4,label:'Esticar na diagonal',M:[[2,1],[1,2]],eig:'λ = 3 em [1, 1] e λ = 1 em [1, −1]'},
    horizontal:{start:0,label:'Esticar na horizontal',M:[[2,0],[0,1]],eig:'λ = 2 em [1, 0] e λ = 1 em [0, 1]'},
    cisalhar:{start:0,label:'Inclinar (cisalhamento)',M:[[1,1],[0,1]],eig:'só λ = 1 em [1, 0]'},
    girar:{start:Math.PI/4,label:'Girar 90°',M:[[0,-1],[1,0]],eig:'nenhum autovetor real: toda direção gira'}
  };
  window.AlgebraLab.register({
    id:'autovalores-direcao',topic:'Autovalores e autovetores',title:'A direção que não gira',
    application:'Ao esticar uma foto, quase toda direção entorta. Algumas só aumentam ou diminuem: são os autovetores da transformação.',
    connection:'Av = λv: o autovetor v mantém a direção, e o autovalor λ diz quanto ele estica. Esse é o coração do PageRank, da compressão de imagens e do PCA.',
    source:{label:'Referência · autovalores no NumPy',url:'https://numpy.org/doc/stable/reference/generated/numpy.linalg.eig.html'},
    mount(api){
      let key='diagonal',progress=0;
      api.select('Transformação',Object.entries(matrices).map(([value,m])=>({value,label:m.label})),key,v=>{key=v;play();});
      function play(){api.loop(6000,p=>{progress=p;draw();});}
      function draw(){
        const {M,eig,start}=matrices[key];const a=start+progress*Math.PI*2,v=[Math.cos(a),Math.sin(a)],Av=[M[0][0]*v[0]+M[0][1]*v[1],M[1][0]*v[0]+M[1][1]*v[1]];
        const cross=v[0]*Av[1]-v[1]*Av[0],len=Math.hypot(...Av),parallel=len>1e-6&&Math.abs(cross)/len<.045;
        const {svg,w,h}=api.svg();arrowHead(api,svg,'hv',other);arrowHead(api,svg,'hav',accent);
        const P=plane(api,svg,w,h,[-3.4,3.4],[-3.4,3.4],{square:true,top:36,bottom:20});
        api.el('circle',{cx:P(0,0)[0],cy:P(0,0)[1],r:P(1,0)[0]-P(0,0)[0],fill:'none',stroke:border,'stroke-dasharray':'3 5'},svg);
        vec(api,svg,P,v,other,'hv',{'stroke-dasharray':'6 5'});vec(api,svg,P,Av,accent,'hav',{'stroke-width':parallel?5:3});
        text(api,svg,P(...v)[0]+8,P(...v)[1]-6,'v',{fill:other});text(api,svg,P(...Av)[0]+8,P(...Av)[1]-6,'Av',{fill:accent});
        text(api,svg,w/2,22,parallel?`Autovetor! Av = ${fmt(Av[0]/v[0]||Av[1]/v[1],1)} · v`:'Av saiu da direção de v',{'text-anchor':'middle',fill:parallel?accent:ink});
        api.status(parallel?'Nessa direção, a transformação só estica ou encolhe: v é um autovetor.':'Enquanto v gira, observe quando Av fica alinhado com ele.');
        api.math('Av = λv',api.matrix(M)+`<p>${eig}</p><p class="muted">A seta tracejada v percorre todas as direções.</p>`);
      }
      api.onResize(draw);play();
    }
  });

  window.AlgebraLab.register({
    id:'autovalores-markov',topic:'Autovalores e autovetores',title:'Para onde vai a audiência?',
    application:'Um serviço de streaming estima quantos assinantes ele e o concorrente terão no longo prazo, mês após mês.',
    connection:'Multiplicar pela mesma matriz várias vezes leva ao autovetor de λ = 1. Diagonalizar a matriz mostra por que: os outros autovalores encolhem a cada mês.',
    source:{label:'Referência · cadeias de Markov',url:'https://en.wikipedia.org/wiki/Markov_chain#Stationary_distribution_relation_to_eigenvectors_and_simplices'},
    mount(api){
      let stay=90,start=20,progress=0;const q=.8,MONTHS=18;
      api.range('Clientes que ficam no A por mês (%)',60,98,2,stay,v=>{stay=v;play();});
      api.range('Começa com quantos % no A',0,100,10,start,v=>{start=v;play();});
      function play(){api.loop(3600,p=>{progress=p;draw();});}
      function draw(){
        const p=stay/100,P=[[p,1-q],[1-p,q]],steady=(1-q)/((1-p)+(1-q)),lam2=p+q-1;
        const hs=[[start/100,1-start/100]];for(let k=0;k<MONTHS;k++){const [a,b]=hs[k];hs.push([P[0][0]*a+P[0][1]*b,P[1][0]*a+P[1][1]*b]);}
        const k=Math.min(MONTHS,Math.floor(progress*MONTHS));
        const {svg,w,h}=api.svg();text(api,svg,w/2,22,`Mês ${k}: ${fmt(hs[k][0]*100,0)}% no A`,{'text-anchor':'middle'});
        const left=36,bw=(w-72)/(MONTHS+1),base=h-50,H=h-110;
        const yS=base-steady*H;line(api,svg,[left,yS],[w-36,yS],{stroke:accent,'stroke-dasharray':'5 5'});text(api,svg,w-36,yS-8,`equilíbrio ${fmt(steady*100,0)}%`,{'text-anchor':'end',fill:accent,'font-size':12});
        hs.slice(0,k+1).forEach(([a],i)=>{api.el('rect',{x:left+bw*i+2,y:base-H,width:bw-4,height:H*(1-a),rx:3,fill:other,'fill-opacity':.25},svg);api.el('rect',{x:left+bw*i+2,y:base-H*a,width:bw-4,height:H*a,rx:3,fill:accent,'fill-opacity':.75},svg);});
        text(api,svg,left,base+20,'mês 0',{fill:muted,'font-size':12});text(api,svg,w-36,base+20,`mês ${MONTHS}`,{fill:muted,'font-size':12,'text-anchor':'end'});
        api.status(`Não importa o ponto de partida: a fatia do A tende a ${fmt(steady*100,0)}%, o autovetor de λ = 1.`);
        api.math('Pᵏ v₀ → autovetor',api.matrix(P,{colLabels:['de A','de B'],rowLabels:['A','B']})+`<p>Autovalores: <span class="hot">1</span> e ${fmt(lam2)}</p><p>P = V D V⁻¹ → Pᵏ = V Dᵏ V⁻¹</p><p class="muted">${fmt(lam2)}ᵏ some com o tempo; só sobra a parte de λ = 1.</p>`);
      }
      api.onResize(draw);play();
    }
  });

  window.AlgebraLab.register({
    id:'autovalores-base',topic:'Autovalores e autovetores',title:'Dois botões alcançam a tela toda?',
    application:'Um jogo move o personagem com dois botões de direção. Com direções independentes, ele chega a qualquer ponto; se forem paralelas, fica preso em uma linha.',
    connection:'Vetores linearmente independentes formam uma base: qualquer ponto vira a·u + b·v. Se forem dependentes, o determinante é zero e parte do plano fica inalcançável.',
    source:{label:'Referência · base e independência linear',url:'https://numpy.org/doc/stable/reference/generated/numpy.linalg.matrix_rank.html'},
    mount(api){
      let angle=60,progress=0;const u=[1.4,0],T=[1.6,2.2];
      api.range('Ângulo do botão B (graus)',0,180,15,angle,v=>{angle=v;play();});
      function play(){api.loop(2400,p=>{progress=p;draw();});}
      function draw(){
        const r=angle*Math.PI/180,v=[1.2*Math.cos(r),1.2*Math.sin(r)],det=u[0]*v[1]-u[1]*v[0],indep=Math.abs(det)>1e-6;
        const {svg,w,h}=api.svg();arrowHead(api,svg,'bu',other);arrowHead(api,svg,'bv',third);arrowHead(api,svg,'bp',accent);
        const P=plane(api,svg,w,h,[-3.2,3.2],[-1.4,3.2],{square:true,top:36,bottom:24});
        for(let a=-3;a<=3;a++)for(let b=-3;b<=3;b++){const p=[a*u[0]+b*v[0],a*u[1]+b*v[1]];if(Math.abs(p[0])<3.3&&p[1]>-1.5&&p[1]<3.3)api.el('circle',{cx:P(...p)[0],cy:P(...p)[1],r:2.5,fill:muted,'fill-opacity':.6},svg);}
        api.el('circle',{cx:P(...T)[0],cy:P(...T)[1],r:9,fill:'none',stroke:accent,'stroke-width':2},svg);text(api,svg,P(...T)[0]+12,P(...T)[1]-10,'alvo',{fill:accent,'font-size':13});
        vec(api,svg,P,u,other,'bu');vec(api,svg,P,v,third,'bv');text(api,svg,P(...u)[0]+6,P(...u)[1]+18,'u',{fill:other});text(api,svg,P(...v)[0]-14,P(...v)[1]-6,'v',{fill:third});
        let a=0,b=0;
        if(indep){a=(T[0]*v[1]-T[1]*v[0])/det;b=(u[0]*T[1]-u[1]*T[0])/det;const t1=Math.min(1,progress*2),t2=Math.max(0,progress*2-1);const m=[a*u[0]*t1,a*u[1]*t1],e=[m[0]+b*v[0]*t2,m[1]+b*v[1]*t2];
          line(api,svg,P(0,0),P(...m),{stroke:other,'stroke-width':3,'stroke-dasharray':'6 4'});if(t2>0)line(api,svg,P(...m),P(...e),{stroke:third,'stroke-width':3,'stroke-dasharray':'6 4'});api.el('circle',{cx:P(...e)[0],cy:P(...e)[1],r:7,fill:accent},svg);}
        text(api,svg,w/2,22,indep?`alvo = ${fmt(a,1)}·u + ${fmt(b,1)}·v`:'u e v são paralelos: só dá para andar numa linha',{'text-anchor':'middle',fill:indep?ink:accent});
        api.status(indep?'Direções independentes formam uma base: qualquer ponto da tela é alcançável.':'Vetores dependentes: o alvo fora da linha nunca será alcançado.');
        api.math('base de R²',api.matrix([[u[0],v[0]],[u[1],v[1]]],{colLabels:['u','v']})+`<p>det = <span class="hot">${fmt(det)}</span></p><p>${indep?'det ≠ 0 → independentes → base':'det = 0 → dependentes → não é base'}</p>`);
      }
      api.onResize(draw);play();
    }
  });
})();
