const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const elementos = new Map();
function elemento(id) {
  if (!elementos.has(id)) elementos.set(id, {hidden:false,textContent:'',children:[],events:{},replaceChildren(){this.children=[]},appendChild(c){this.children.push(c)},addEventListener(e,fn){this.events[e]=fn},scrollIntoView(){},click(){this.events.click?.({preventDefault(){}})}});
  return elementos.get(id);
}
let iniciar, aplicacoes=0, erro=false;
const equipe={membros:[{id:'v',nome:'Vinicius',cargo:'Corretor',grupo:'comercial',imoveis:['AR-1']},{id:'b',nome:'Bruna de Paula',cargo:'Administrativo',grupo:'administrativo',imoveis:[]},{id:'c',nome:'Bruna Chaene',cargo:'Administrativo',grupo:'administrativo',imoveis:[]}]};
const state={feedReal:true,all:[{id:'AR-1'},{id:'AR-2'}]};
const location={hash:''};
const contexto={console,URL,AbortController,setTimeout,clearTimeout,state,location,ARBOR_DATA_URL:'https://example.com/feed/vrsync.xml',window:{},document:{getElementById:elemento,querySelectorAll(){return [elemento('equipe-section')]},createElement(){return {...elemento('template'),children:[],querySelector(){return null}}},addEventListener(e,fn){if(e==='DOMContentLoaded')iniciar=fn}},history:{replaceState(a,b,h){location.hash=h}},requestAnimationFrame(fn){fn()},showView(){},goHome(){location.hash=''},applyFilters(){aplicacoes++},fetch:async()=>({ok:!erro,json:async()=>equipe})};
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../equipe.js'),'utf8'),contexto);
const ui=contexto.window.ArborEquipe;
elemento('btn-reset').events.click=()=>ui.limpar();
async function turno(){await new Promise(r=>setImmediate(r));}
(async()=>{
  location.hash='#equipe=v';
  assert.equal(ui.rotear(location.hash),true);
  assert.equal(location.hash,'#equipe=v','Não apagar carteira enquanto carrega');
  iniciar();await turno();
  assert.equal(elemento('equipe-comercial').children.length,1);
  assert.equal(elemento('equipe-administrativo').children.length,2);
  assert.deepEqual(ui.filtrar(state.all).map(p=>p.id),['AR-1']);
  assert.equal(location.hash,'#equipe=v');
  assert.equal(elemento('equipe-carteira-nome').textContent,'Imóveis de Vinicius');
  assert.equal(elemento('equipe-carteira').hidden,false);
  state.feedReal=false;
  assert.equal(ui.filtrar(state.all).length,0,'Não usar dados ilustrativos como carteira real');
  state.feedReal=true;
  elemento('equipe-ver-todos').click();
  assert.equal(ui.filtrar(state.all).length,2);
  assert.equal(elemento('equipe-carteira').hidden,true);
  assert.ok(ui.rotear('#equipe=%ZZ'));
  assert.ok(ui.rotear('#equipe=inexistente'));
  erro=true;elemento('equipe-retry').click();await turno();
  assert.equal(elemento('equipe-retry').hidden,false);
  erro=false;elemento('equipe-retry').click();await turno();
  assert.equal(elemento('equipe-retry').hidden,true);
  assert.equal(elemento('equipe-administrativo').children.length,2);
  assert.ok(aplicacoes>0);
  console.log('OK: interface da equipe, seleção/carteira, links/reload pendente, administrativo, limpar, rota inválida, fallback, falha e retry.');
})().catch(e=>{console.error(e);process.exit(1)});
