const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');
const indexPath = process.argv[2] || path.join(__dirname, '../index.html');
const html = fs.readFileSync(indexPath, 'utf8');
const helpers = html.slice(html.indexOf('const pdfPhotoUrl'), html.indexOf('const pdfEscape'));
function harness(fail = new Set(), conversionFail = new Set(), onLoad = () => {}) {
  const requested = [], converted = [];
  let now = 100;
  const context = {
    URL, Set, Promise, setTimeout, clearTimeout,
    Date: { now: () => now },
    console: { warn() {} },
    document: { createElement(tag) {
      assert.equal(tag, 'textarea');
      return { set innerHTML(v) { this.value = v.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>'); } };
    } },
    Image: class {
      set src(value) {
        assert.equal(this.crossOrigin, 'anonymous');
        this.url = value; requested.push(value);
        queueMicrotask(() => {
          onLoad(value, delta => { now += delta; });
          const id = new URL(value).pathname;
          if (fail.has(id)) this.onerror?.(); else this.onload?.();
        });
      }
    },
    pdfWatercolorPhoto(img, width, height) {
      const id = new URL(img.url).pathname;
      if (conversionFail.has(id)) throw Error('Conversão indisponível');
      converted.push({id,width,height}); return id;
    },
  };
  vm.createContext(context);
  vm.runInContext(helpers + '\nglobalThis.collect=collectPdfPhotos;', context);
  return { collect: context.collect, requested, converted };
}
const photo = id => `https://photos.example/${id}?alt=media&amp;token=valid-${id}`;
test('links do HTML são decodificados; original e token preservados; no máximo 5 fotos', async () => {
  const h = harness();
  const photos = await h.collect(Array.from({length:8}, (_,i) => photo(i+1)));
  assert.deepEqual(Array.from(photos), ['/1','/2','/3','/4','/5']);
  assert.equal(h.requested.length, 5);
  assert.ok(h.requested.every(u => new URL(u).searchParams.has('token') && !u.includes('&amp;') && !u.includes('arborpdf')));
  assert.deepEqual(h.converted[0], {id:'/1',width:1400,height:626});
  assert.ok(h.converted.slice(1).every(p => p.width===640 && p.height===405));
});
test('falhas de carregamento e conversão são substituídas mantendo a ordem', async () => {
  const h = harness(new Set(['/2']), new Set(['/4']));
  const result = await h.collect(Array.from({length:8}, (_,i) => photo(i+1)));
  assert.deepEqual(Array.from(result), ['/1','/3','/5','/6','/7']);
  assert.equal(h.requested.filter(u => new URL(u).pathname==='/2').length, 2);
  assert.ok(h.requested.some(u => new URL(u).pathname==='/2' && new URL(u).searchParams.has('arborpdf')));
  assert.ok(h.requested.every(u => new URL(u).searchParams.has('token')));
  assert.ok(!h.requested.some(u => new URL(u).pathname==='/8'));
});
test('sem repetição ou URLs inseguras e respeita catálogos com menos de 5 fotos', async () => {
  const h = harness();
  const result = await h.collect([photo(1),photo(1).replace(/&amp;/g,'&'),photo(2),null,'javascript:alert(1)','data:image/png;base64,AA==','https://user:password@photos.example/3']);
  assert.deepEqual(Array.from(result), ['/1','/2']); assert.equal(h.requested.length, 2);
  assert.deepEqual(Array.from(await h.collect([])), []);
});
test('falhas totais encerram sem bloquear o PDF e há limite total de tempo', async () => {
  const h = harness(new Set(['/1','/2','/3','/4','/5','/6']),new Set(),(_u,advance)=>advance(61000));
  assert.deepEqual(Array.from(await h.collect(Array.from({length:6}, (_,i)=>photo(i+1)))), []);
  assert.equal(h.requested.length, 5);
});
test('a ficha utiliza as fotos coletadas em vez de cortar o catálogo antes das tentativas', () => {
  assert.ok(html.includes('const photos=await collectPdfPhotos(p.photos);'));
  assert.ok(!html.includes('const imgs=await Promise.all(urls.map(preloadPdfImage));'));
});
