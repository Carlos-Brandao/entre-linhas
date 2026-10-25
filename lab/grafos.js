(() => {
  const ink='var(--foreground)', border='var(--border)', accent='var(--viz-series-1)', other='var(--viz-series-2)', bg='var(--background)', muted='var(--muted-foreground)';
  function text(api,svg,x,y,label,extra={}) {return api.el('text',{x,y,fill:ink,'font-size':14,...extra},svg,label);}
  function line(api,svg,a,b,attrs={}) {return api.el('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:border,'stroke-width':1.5,...attrs},svg);}
  function positions(w,h,points,pad=40) {return points.map(([x,y])=>[pad+x*(w-2*pad),62+y*(h-140)]);}
  function marker(api,svg,id,color) {const defs=api.el('defs',{},svg);const m=api.el('marker',{id,viewBox:'0 0 8 8',refX:7,refY:4,markerWidth:7,markerHeight:7,orient:'auto'},defs);api.el('path',{d:'M 0 0 L 8 4 L 0 8 Z',fill:color},m);}
  function adjacency(edges) {const A=Array.from({length:6},()=>Array(6).fill(0));edges.forEach(([a,b])=>{A[a][b]=1;A[b][a]=1;});return A;}
  function bfs(edges){const A=adjacency(edges),queue=[0],seen=new Set([0]),previous={};while(queue.length){const u=queue.shift();if(u===5)break;A[u].forEach((v,i)=>{if(v&&!seen.has(i)){seen.add(i);previous[i]=u;queue.push(i);}});}if(!seen.has(5))return [];const route=[5];while(route[0]!==0)route.unshift(previous[route[0]]);return route;}
  function onPath(a,b,path){return path.some((u,i)=>i&&((u===a&&path[i-1]===b)||(u===b&&path[i-1]===a)));}
  // Index of the node the traveller is leaving at progress p.
  function leg(path,p){return Math.min(path.length-2,Math.floor(p*(path.length-1)));}
  function travelling(api,svg,pos,path,p){if(p===null||path.length<2)return;const n=leg(path,p),t=p===1?1:p*(path.length-1)-n;const a=pos[path[n]],b=pos[path[n+1]];api.el('circle',{cx:a[0]+(b[0]-a[0])*t,cy:a[1]+(b[1]-a[1])*t,r:9,fill:accent,stroke:bg,'stroke-width':3},svg);}
  const friends=['Você','Ana','Bia','Caio','Dani','Eva'];
  const friendXY=[[0,.5],[.32,0],[.32,1],[.68,0],[.68,1],[1,.5]];
  const originalEdges=[[0,1],[0,2],[1,3],[2,4],[3,5],[4,5]];
  window.AlgebraLab.register({
    id:'grafos-bfs',topic:'Grafos',title:'Uma amizade encurta o caminho',
    application:'Uma rede social encontra quem pode apresentar você a Eva.',
    connection:'Matrizes de adjacência guardam quem conhece quem; o grafo torna essas relações visíveis.',
    source:{label:'Referência · conexões em grafos',url:'https://networkx.org/documentation/stable/reference/algorithms/traversal.html'},
    mount(api){
      let knowsDani=false,edges=originalEdges.slice(),route=bfs(edges),progress=0;
      const toggle=api.button('Você conhece Dani',()=>{knowsDani=!knowsDani;edges=knowsDani?[...originalEdges,[0,4]]:originalEdges.slice();route=bfs(edges);toggle.textContent=knowsDani?'Voltar às amizades iniciais':'Você conhece Dani';update();play();},{primary:true});
      function update(){api.status(knowsDani?'Agora você chega até Eva por Dani: uma conexão a menos.':'Ana apresenta você a Caio, e Caio conhece Eva: três conexões.');}
      function play(){api.loop(1800,p=>{progress=p;draw();});}
      function draw(){
        const {svg,w,h}=api.svg(),pos=positions(w,h,friendXY,46);
        text(api,svg,w/2,24,knowsDani?'Nova amizade → caminho mais curto':'Quem conhece quem?',{'text-anchor':'middle'});
        edges.forEach(([a,b])=>line(api,svg,pos[a],pos[b],{stroke:onPath(a,b,route)?accent:border,'stroke-width':onPath(a,b,route)?3.5:1.5}));
        const here=route[leg(route,progress)];
        pos.forEach(([x,y],i)=>{const active=route.includes(i);api.el('circle',{cx:x,cy:y,r:25,fill:bg},svg);api.el('circle',{cx:x,cy:y,r:25,fill:active?accent:bg,'fill-opacity':active?.18:1,stroke:i===here?accent:border,'stroke-width':i===here?2.5:1.5},svg);text(api,svg,x,y+5,friends[i],{'text-anchor':'middle'});});
        travelling(api,svg,pos,route,progress);
        text(api,svg,w/2,h-14,`${route.map(i=>friends[i]).join(' → ')}  ·  ${route.length-1} conexões`,{'text-anchor':'middle'});
        const A=adjacency(edges),initials=friends.map(f=>f[0]);
        api.math('matriz de adjacência',api.matrix(A,{rowLabels:initials,colLabels:initials,mark:(i,j)=>onPath(i,j,route)?'on':i===here?'row':''})+
          `<p>Linha <span class="hot">${friends[here]}</span>: os 1 mostram quem ${friends[here]==='Você'?'você conhece':friends[here]+' conhece'}.</p><p class="muted">1 = se conhecem · 0 = não</p>`);
      }
      api.onResize(draw);update();play();
    }
  });
  const roadNames=['Casa','Praça','Parque','Ponte','Loja'];
  const roadXY=[[0,.5],[.32,0],[.32,1],[.68,1],[1,.5]];
  const baseRoads=[[0,1,2],[1,4,12],[0,2,4],[2,3,2],[3,4,3],[1,3,4]];
  function dijkstra(roads){const dist=[0,Infinity,Infinity,Infinity,Infinity],prev=Array(5).fill(null),done=new Set();while(done.size<5){let u=-1;dist.forEach((d,i)=>{if(!done.has(i)&&(u<0||d<dist[u]))u=i;});if(u<0||!Number.isFinite(dist[u]))break;done.add(u);roads.forEach(([a,b,w])=>{const v=a===u?b:b===u?a:null;if(v!==null&&!done.has(v)&&dist[u]+w<dist[v]){dist[v]=dist[u]+w;prev[v]=u;}});}if(!Number.isFinite(dist[4]))return{path:[],time:Infinity};const path=[4];while(prev[path[0]]!==null)path.unshift(prev[path[0]]);return{path,time:dist[4]};}
  window.AlgebraLab.register({
    id:'grafos-dijkstra',topic:'Grafos',title:'O trânsito mudou. A rota também.',
    application:'Um aplicativo escolhe por onde ir para chegar à loja mais rápido.',
    connection:'Grafos representam os caminhos; os números de uma matriz podem registrar o tempo entre lugares.',
    source:{label:'Referência · escolha de rotas',url:'https://networkx.org/documentation/stable/reference/algorithms/shortest_paths.html'},
    mount(api){
      let traffic='livre',progress=0,roads=baseRoads.slice(),result=dijkstra(roads);
      api.select('Situação na ponte',[{value:'livre',label:'Trânsito livre'},{value:'lento',label:'Trânsito pesado'},{value:'fechada',label:'Ponte interditada'}],'livre',value=>{traffic=value;prepare();});
      function prepare(){roads=baseRoads.filter(([a,b])=>!(traffic==='fechada'&&a===3&&b===4)).map(([a,b,c])=>[a,b,c+(traffic==='lento'&&a===3&&b===4?8:0)]);result=dijkstra(roads);update();api.loop(2000,p=>{progress=p;draw();});}
      function update(){api.status(traffic==='livre'?'Pela ponte: 9 minutos. Pelo caminho com menos trechos: 14 minutos.':`O aplicativo evita a ponte e encontra outra rota: ${result.time} minutos.`);}
      function draw(){
        const {svg,w,h}=api.svg(),pos=positions(w,h,roadXY,44);
        text(api,svg,w/2,24,`Chegada em ${result.time} minutos`,{'text-anchor':'middle'});
        baseRoads.forEach(([a,b,cost])=>{
          const closed=traffic==='fechada'&&a===3&&b===4,slow=traffic==='lento'&&a===3&&b===4,active=onPath(a,b,result.path),start=pos[a],end=pos[b];
          line(api,svg,start,end,{stroke:active?accent:slow?other:border,'stroke-width':active?3.5:slow?3:1.5,...(closed?{'stroke-dasharray':'6 6'}:{})});
          const x=(start[0]+end[0])/2,y=(start[1]+end[1])/2,label=closed?'fechada':`${cost+(slow?8:0)} min`;
          api.el('rect',{x:x-31,y:y-12,width:62,height:24,rx:6,fill:bg},svg);text(api,svg,x,y+5,label,{'text-anchor':'middle',fill:active?accent:ink});
        });
        pos.forEach(([x,y],i)=>{api.el('circle',{cx:x,cy:y,r:i===0||i===4?14:8,fill:result.path.includes(i)?accent:bg,'fill-opacity':.25,stroke:border,'stroke-width':1.5},svg);text(api,svg,x,y+(y>h/2?-20:34),roadNames[i],{'text-anchor':'middle'});});
        travelling(api,svg,pos,result.path,progress);
        const W=Array.from({length:5},(_,i)=>Array.from({length:5},(_,j)=>i===j?0:'·'));
        roads.forEach(([a,b,c])=>{W[a][b]=c;W[b][a]=c;});
        const parts=result.path.slice(1).map((v,i)=>W[result.path[i]][v]);
        api.math('matriz de tempos',api.matrix(W,{rowLabels:roadNames.map(n=>n.slice(0,3)),colLabels:roadNames.map(n=>n.slice(0,2)),mark:(i,j)=>onPath(i,j,result.path)?'on':''})+
          `<p>Rota: ${parts.join(' + ')} = <span class="hot">${result.time} min</span></p><p class="muted">Cada número é o tempo de um trecho · “·” = sem rua direta</p>`);
      }
      api.onResize(draw);prepare();
    }
  });
  const pages=['Blog','Guia','Fórum','Receitas'];
  const pageXY=[[0,0],[1,0],[0,1],[1,1]];
  const pageLinks=[[0,1],[0,2],[1,3],[2,3],[3,0]];
  const ITERATIONS=16;
  function rankStep(rank,links,damping){const n=rank.length,result=rank.map(()=>((1-damping)/n));rank.forEach((value,i)=>{const outgoing=links.filter(([a])=>a===i);if(!outgoing.length)result.forEach((_,j)=>result[j]+=damping*value/n);else outgoing.forEach(([,j])=>result[j]+=damping*value/outgoing.length);});return result;}
  function ranking(links){let r=pages.map(()=>.25);for(let n=0;n<120;n++)r=rankStep(r,links,.85);return r;}
  function history(links){const h=[pages.map(()=>.25)];for(let n=0;n<ITERATIONS;n++)h.push(rankStep(h[n],links,.85));return h;}
  window.AlgebraLab.register({
    id:'grafos-pagerank',topic:'Grafos',title:'Um link ajuda uma página a aparecer',
    application:'Um buscador usa as indicações entre páginas como um sinal de destaque.',
    connection:'Matrizes representam os links e ajudam a calcular o destaque de cada página.',
    source:{label:'Referência · destaque de páginas',url:'https://networkx.org/documentation/stable/reference/algorithms/link_analysis.html'},
    mount(api){
      let extra=false,steps=history(pageLinks),progress=0;
      const links=()=>extra?[...pageLinks,[2,1]]:pageLinks;
      const toggle=api.button('Fórum indica o Guia',()=>{extra=!extra;steps=history(links());toggle.textContent=extra?'Retirar a nova indicação':'Fórum indica o Guia';update();play();},{primary:true});
      const percent=links=>`${Math.round(ranking(links)[1]*100)}%`;
      function update(){api.status(extra?`Uma única indicação nova leva o Guia de ${percent(pageLinks)} para ${percent(links())} do destaque.`:'Cada rodada, as páginas repassam destaque pelos links até os valores pararem de mudar.');}
      function play(){api.loop(2600,p=>{progress=p;draw();});}
      function draw(){
        const {svg,w,h}=api.svg(),narrow=w<520,gw=narrow?w:w*.56,gh=narrow?180:h-30;
        const k=Math.min(ITERATIONS,Math.floor(progress*ITERATIONS)),shown=steps[k],flow=(progress*ITERATIONS)%1;
        const pos=pageXY.map(([x,y])=>[60+x*(gw-120),62+y*(gh-110)]);marker(api,svg,'el-page-arrow',muted);marker(api,svg,'el-page-arrow-new',accent);
        text(api,svg,gw/2,24,'Páginas que indicam outras',{'text-anchor':'middle'});
        links().forEach(([a,b])=>{const isNew=a===2&&b===1,start=pos[a],end=pos[b],dx=end[0]-start[0],dy=end[1]-start[1],len=Math.hypot(dx,dy),gap=22+22*Math.abs(dx)/len,s=[start[0]+dx*gap/len,start[1]+dy*gap/len],t=[end[0]-dx*(gap+6)/len,end[1]-dy*(gap+6)/len];line(api,svg,s,t,{'marker-end':`url(#${isNew?'el-page-arrow-new':'el-page-arrow'})`,stroke:isNew?accent:muted,'stroke-width':isNew?3:1.5});if(progress<1)api.el('circle',{cx:s[0]+(t[0]-s[0])*flow,cy:s[1]+(t[1]-s[1])*flow,r:4,fill:accent},svg);});
        pos.forEach(([x,y],i)=>{api.el('rect',{x:x-40,y:y-18,width:80,height:36,rx:8,fill:i===1&&extra?accent:bg,'fill-opacity':i===1&&extra?.18:1,stroke:border,'stroke-width':1.5},svg);text(api,svg,x,y+5,pages[i],{'text-anchor':'middle'});});
        const x=narrow?16:gw+16,y=narrow?gh+16:62,barWidth=narrow?w-150:w-gw-110,row=narrow?26:32;
        text(api,svg,x,y,`Destaque · rodada ${k}`);
        const best=shown.indexOf(Math.max(...shown));
        shown.forEach((value,i)=>{const yy=y+26+i*row;text(api,svg,x,yy+5,pages[i]);api.el('rect',{x:x+72,y:yy-8,width:Math.max(1,barWidth*value/.45),height:15,rx:3,fill:i===best?accent:other,'fill-opacity':i===best?1:.45},svg);});
        api.math('vetor de destaque',`<p style="margin:0">r<sub>${k}</sub> = M · r<sub>${Math.max(0,k-1)}</sub></p>`+api.matrix(shown.map(v=>[`${Math.round(v*100)}%`]),{rowLabels:pages,mark:i=>i===best?'on':''})+
          `<p class="muted">A matriz M guarda os links. Multiplicar várias vezes faz o destaque se estabilizar.</p>`);
      }
      api.onResize(draw);update();play();
    }
  });
  window.AlgebraLab.graphMath={adjacency,bfs,dijkstra,rankStep,ranking};
})();
