/* Fontes oficiais conferidas em 11/10/2026. Sem consulta de dados pessoais. */
(() => {
  const checked = '11/10/2026';
  const municipalities = [
    {id:'goiania',name:'Goiânia',iptu:'https://www.goiania.go.gov.br/sing_servicos/emissao-duam-itu-iptu-issqn/',itbi:'https://www.goiania.go.gov.br/sistemas/SISTI/asp/sisti00000f0.asp',text:'Emita o DUAM de IPTU/ITU com a inscrição municipal do imóvel. O portal da prefeitura também oferece consulta cadastral e de valor venal.',extra:['Cadastro e valor venal','https://www.goiania.go.gov.br/Sistemas/Siptu/asp/siptu00000f0.asp']},
    {id:'canedo',name:'Senador Canedo',iptu:'https://senadorcanedo.go.gov.br/iptu-itu-e-itbi/',itbi:'https://senadorcanedo.go.gov.br/iptu-itu-e-itbi/',text:'A página tributária reúne as opções de IPTU/ITU, solicitação de ITBI e emissão do laudo. Escolha o serviço correspondente ao seu imóvel.'},
    {id:'hidrolandia',name:'Hidrolândia',iptu:'https://www.hidrolandia.go.gov.br/servico/emissao-de-iptu/',itbi:'https://www.hidrolandia.go.gov.br/servico/vaptvupt-avaliacao-de-itbi/',text:'Para emitir IPTU, a prefeitura informa nome ou razão social, CCI e CPF entre os requisitos. A avaliação de ITBI tem uma página própria com documentos e atendimento.'},
    {id:'aparecida',name:'Aparecida de Goiânia',iptu:'https://aparecida.go.gov.br/iptu-e-itu-2026-ja-estao-disponiveis-no-site-da-prefeitura-de-aparecida',itbi:'https://aparecida.go.gov.br/reducao-do-itbi-em-aparecida-comecou-nesta-segunda-feira-com-aliquota-de-15',text:'A orientação oficial para IPTU/ITU é acessar Serviços ao Cidadão → Débitos do Contribuinte. Confira também o aviso sobre a redução temporária do ITBI em 2026.'},
    {id:'anapolis',name:'Anápolis',iptu:'https://portaldocidadao.anapolis.go.gov.br/',itbi:'https://portaldocidadao.anapolis.go.gov.br/',text:'O Portal do Cidadão disponibiliza acesso ao IPTU 2026 e aos serviços municipais. Alguns serviços exigem identificação ou acesso com login.'},
    {id:'trindade',name:'Trindade',iptu:'https://trindade.go.gov.br/prefeitura-de-trindade-disponibiliza-iptu-2026-com-descontos-de-ate-25-e-nova-forma-de-cobranca-da-tarifa-de-residuos-solidos/',itbi:'https://trindade.go.gov.br/servicos/',text:'Consulte o comunicado de IPTU 2026 e a página de serviços da SEFAZ. Em 2026, a prefeitura anunciou cobrança da tarifa de resíduos na conta de água, separada do IPTU.'}
  ];
  const notices = [
    {city:'aparecida',date:'2026-10-05',end:'2026-11-06',topic:'ITBI',title:'Aparecida anuncia redução temporária de ITBI para 1,5%',text:'O comunicado municipal prevê o programa até 6 de novembro de 2026, para as transmissões e condições descritas na Lei Complementar nº 251/2026. Leia as condições, a exigência de pagamento e o prazo de registro na fonte.',url:municipalities[3].itbi},
    {city:'canedo',date:'2026-04-22',end:'2026-04-30',topic:'IPTU / ITU',title:'Senador Canedo informou desconto de 20% à vista até 30 de abril',text:'O aviso de abril também informou parcelamento em até seis vezes. O prazo do desconto citado terminou; consulte a situação atual do imóvel no canal oficial.',url:'https://senadorcanedo.go.gov.br/ultimos-dias-para-garantir-20-de-desconto-no-iptu-2026-em-senador-canedo/'},
    {city:'aparecida',date:'2026-03-09',end:'2026-04-02',topic:'IPTU / ITU',title:'IPTU de Aparecida: comunicado de 2026 previu até dez parcelas',text:'A notícia anunciou desconto de 15% para pagamento à vista até 2 de abril. Esse prazo encerrou. A guia individual informa parcelas, vencimentos e débitos do contribuinte.',url:municipalities[3].iptu},
    {city:'anapolis',date:null,end:'2026-04-30',topic:'IPTU / ITU',title:'Anápolis prorrogou o prazo de desconto de 2026 para 30 de abril',text:'A prefeitura informou abatimento de 10% à vista, podendo chegar a 15% conforme as condições do Programa Contribuinte Legal, e até oito parcelas. O prazo do abatimento encerrou.',url:'https://www.anapolis.go.gov.br/prazo-para-pagamento-do-iptu-e-itu-com-desconto-em-anapolis-e-prorrogado-ate-30-de-abril/'},
    {city:'trindade',date:null,end:'2026-06-10',topic:'IPTU',title:'Trindade separou a tarifa de resíduos do IPTU em 2026',text:'O comunicado municipal informa cobrança em 12 parcelas na conta de água. Os períodos de desconto de IPTU citados na notícia terminaram em maio e junho de 2026.',url:municipalities[5].iptu}
  ];
  const el = (tag,cls,text) => {const node=document.createElement(tag);if(cls)node.className=cls;if(text)node.textContent=text;return node;};
  const link = (text,url,cls) => {const a=el('a',cls,text);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;};
  const grid=document.getElementById('official-cities'),news=document.getElementById('official-notices'),select=document.getElementById('official-city');
  if(!grid||!news||!select)return;
  municipalities.forEach(m=>{const o=el('option',null,m.name);o.value=m.id;select.append(o);});
  const render=()=>{
    const selected=select.value;
    grid.replaceChildren();news.replaceChildren();
    municipalities.filter(m=>selected==='all'||selected===m.id).forEach(m=>{
      const card=el('article','official-card');card.append(el('h4',null,m.name),el('p',null,m.text));
      const links=el('div','official-links');links.append(link('Consultar IPTU ↗',m.iptu),link(m.id==='trindade'?'Serviços municipais ↗':'ITBI / serviços ↗',m.itbi));
      if(m.extra)links.append(link(m.extra[0]+' ↗',m.extra[1]));card.append(links);grid.append(card);
    });
    const items=notices.filter(n=>selected==='all'||n.city===selected);
    const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    items.forEach(n=>{
      const city=municipalities.find(m=>m.id===n.city);const a=link('',n.url,'official-news-item');
      const meta=el('div','official-news-meta','Prefeitura de '+city.name+' · '+n.topic+(n.date?' · '+n.date.split('-').reverse().join('/'):' · Comunicado de 2026'));
      meta.append(el('span','official-status',today>n.end?'Histórico · prazo encerrado':'Prazo informado: '+n.end.split('-').reverse().join('/')));
      a.append(meta,el('h5',null,n.title+' ↗'),el('p',null,n.text));news.append(a);
    });
    if(!items.length)news.append(el('p','official-note','Nenhum comunicado específico selecionado nesta revisão. Use o canal oficial acima para consultar o imóvel e os avisos da prefeitura.'));
  };
  select.addEventListener('change',render);render();
  document.getElementById('official-checked').textContent='Fontes conferidas em '+checked+'. Valores individuais, descontos e vencimentos devem ser consultados na guia municipal. Os links abrem o site da fonte.';
})();
