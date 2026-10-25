(() => {
  const context=document.modelContext;
  if(!context?.registerTool)return;
  const lifecycle=new AbortController();
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
  const tool={
    name:'open_algebra_demo',
    title:'Abrir demonstração de Álgebra',
    description:'Abre uma demonstração didática do Entre Linhas e a seleciona na página do conteúdo correspondente. Não responde ao quiz.',
    inputSchema:{type:'object',properties:{demoId:{type:'string',enum:window.EL_DEMOS.map(d=>d.id)}},required:['demoId'],additionalProperties:false},
    annotations:{readOnlyHint:false,untrustedContentHint:false},
    async execute(input){
      if(!input||typeof input.demoId!=='string'||Object.keys(input).some(key=>key!=='demoId'))throw new Error('Informe somente um demoId válido.');
      const demo=window.EL_DEMOS.find(d=>d.id===input.demoId);
      const topic=window.EL_TOPICS.find(t=>t.demos.includes(input.demoId));
      if(!demo||!topic)throw new Error('Demonstração não encontrada.');
      location.hash=topic.id+'/demonstracoes';
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      document.querySelector(`[data-demo="${demo.id}"]`).click();
      return {topic:topic.title,demoId:demo.id,title:demo.title};
    }
  };
  try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}
})();
