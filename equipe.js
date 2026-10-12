/* Equipe pública: cadastro e carteiras vêm do ERP, nunca de uma lista manual. */
(() => {
    let membros = [], selecionado = null, carregando = false, carregou = false, falhou = false;
    const el = id => document.getElementById(id);
    const seguro = valor => String(valor || '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
    const fotoSegura = v => {
  const valor = String(v || '').trim();
  if (valor.startsWith('data:')) {
    if (valor.length > 1500000) return '';
    const m = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(valor);
    if (!m || m[2].length % 4 !== 0) return '';
    try {
      const bytes = atob(m[2].slice(0, 16));
      const png = bytes.startsWith('\x89PNG\r\n\x1a\n');
      const jpeg = bytes.startsWith('\xff\xd8\xff');
      const webp = bytes.startsWith('RIFF') && bytes.slice(8, 12) === 'WEBP';
      return (m[1] === 'png' && png || m[1] === 'jpeg' && jpeg || m[1] === 'webp' && webp) ? valor : '';
    } catch { return ''; }
  }
  try { const u = new URL(valor); return u.protocol === 'https:' && !u.username && !u.password ? u.href : ''; } catch { return ''; }
};
    const resumoBreve = valor => { const t = String(valor || '').trim(); if (t.startsWith('Minha trajetória é construída no mercado imobiliário, unindo experiência prática')) return 'Experiência no mercado imobiliário, com visão de negócio, inteligência de mercado e gestão comercial.'; if (t.startsWith('Com formação em Direito e mais de 18 anos de experiência no mercado imobiliário')) return 'Formado em Direito, tem mais de 18 anos de experiência no mercado imobiliário, com atuação nas áreas comercial e de marketing.'; if (t.length < 240) return t; const corte = t.slice(0, 240); const fim = Math.max(corte.lastIndexOf('.'), corte.lastIndexOf('!'), corte.lastIndexOf('?')); return fim >= 80 ? corte.slice(0, fim + 1) : corte.slice(0, corte.lastIndexOf(' ')).trimEnd() + '…'; };
    const codigo = valor => String(valor || '').trim().toUpperCase();
    const carteira = membro => new Set(membro.imoveis.map(codigo));
    const quantidade = membro => state.feedReal ? state.all.filter(p => carteira(membro).has(codigo(p.id))).length : 0;

    function renderizar() {
        document.querySelectorAll('[data-arbor-equipe]').forEach(item => { item.hidden = !membros.length; });
        for (const grupo of ['comercial', 'administrativo']) {
            const lista = membros.filter(m => m.grupo === grupo);
            el('equipe-' + grupo).replaceChildren();
            lista.forEach(m => {
                const card = document.createElement('article');
                card.className = 'equipe-card';
                const foto = fotoSegura(m.foto);
                const iniciais = m.nome.split(/\s+/).filter(Boolean).slice(0, 2).map(n => n[0]).join('');
                card.innerHTML = `<div class="equipe-retrato"><span aria-hidden="true">${seguro(iniciais)}</span>${foto ? `<img src="${seguro(foto)}" alt="${seguro(m.nome)}" loading="lazy">` : ''}</div><div class="equipe-info"><h3>${seguro(m.nome)}</h3>${m.resumo ? `<p class="equipe-resumo">${seguro(resumoBreve(m.resumo))}</p>` : ''}${m.grupo === 'comercial' && m.creci ? `<small>CRECI ${seguro(m.creci)}</small>` : ''}${quantidade(m) > 0 ? `<a class="equipe-link" href="#equipe=${encodeURIComponent(m.id)}">Ver imóveis <span aria-hidden="true">↗</span></a><small>${quantidade(m)} ${quantidade(m) === 1 ? 'imóvel disponível' : 'imóveis disponíveis'}</small>` : ''}</div>`;
                const contatos = document.createElement('div');
                contatos.className = 'equipe-contatos';
                const links = [];
                try { const u = new URL(m.instagram); if (u.protocol === 'https:' && ['instagram.com','www.instagram.com'].includes(u.hostname) && /^\/[a-zA-Z0-9._]{1,30}\/$/.test(u.pathname) && !u.username && !u.password) links.push(['Instagram', u.href]); } catch {}
                if (/^https:\/\/wa\.me\/55[1-9]\d{9,10}$/.test(m.whatsapp || '')) links.push(['WhatsApp', m.whatsapp]);
                if (/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@arborimoveis\.com\.br$/i.test(m.email || '')) links.push(['E-mail', 'mailto:' + m.email]);
                contatos.innerHTML = links.map(([label, href]) => `<a href="${seguro(href)}"${label === 'E-mail' ? '' : ' target="_blank" rel="noopener noreferrer"'} aria-label="${seguro(label + ' de ' + m.nome)}">${label}</a>`).join('');
                if (links.length) card.querySelector('.equipe-info')?.appendChild(contatos);
                card.querySelector('img')?.addEventListener('error', e => e.target.remove());
                el('equipe-' + grupo).appendChild(card);
            });
            el('equipe-' + grupo + '-bloco').hidden = !lista.length;
        }
        el('equipe-status').textContent = membros.length ? '' : 'A equipe será apresentada aqui em breve.';
        el('equipe-retry').hidden = true;
    }
    const TITULO_BASE = document.title;
    const funcao = m => m.grupo === 'administrativo' ? 'Equipe administrativa' : 'Equipe comercial';
    function limparPerfil() {
        const box = el('resp-perfil');
        if (box) { box.hidden = true; box.replaceChildren(); }
        el('catalogo-view')?.classList.remove('ui-catalogo--resp', 'ui-resp-carregando');
        document.title = TITULO_BASE;
    }
    function mostrarPerfil(m) {
        const box = el('resp-perfil');
        if (!box) return;
        const foto = fotoSegura(m.foto);
        const iniciais = m.nome.split(/\s+/).filter(Boolean).slice(0, 2).map(n => n[0]).join('');
        const primeiro = m.nome.split(/\s+/)[0];
        const wa = /^https:\/\/wa\.me\/55[1-9]\d{9,10}$/.test(m.whatsapp || '') ? m.whatsapp : '';
        let insta = '';
        try { const u = new URL(m.instagram); if (u.protocol === 'https:' && ['instagram.com', 'www.instagram.com'].includes(u.hostname) && /^\/[a-zA-Z0-9._]{1,30}\/$/.test(u.pathname) && !u.username && !u.password) insta = u.href; } catch {}
        const mail = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@arborimoveis\.com\.br$/i.test(m.email || '') ? m.email : '';
        const msg = encodeURIComponent('Olá, ' + primeiro + '! Vi seus imóveis no site da Arbor e gostaria de conversar.');
        const meta = [funcao(m), m.grupo === 'comercial' && m.creci ? 'CRECI ' + seguro(m.creci) : ''].filter(Boolean).join(' · ');
        box.innerHTML = `
            <div class="ui-perfil-card">
                <div class="ui-perfil-foto">${foto ? `<img src="${seguro(foto)}" alt="${seguro(m.nome)}">` : ''}<span aria-hidden="true">${seguro(iniciais)}</span></div>
                <div class="ui-perfil-info">
                    <span class="ui-perfil-eyebrow">Responsável pelos imóveis</span>
                    <h1>${seguro(m.nome)}</h1>
                    <p class="ui-perfil-meta">${meta}</p>
                    ${m.resumo ? `<p class="ui-perfil-resumo">${seguro(resumoBreve(m.resumo))}</p>` : ''}
                    <div class="ui-perfil-acoes">
                        ${wa ? `<a class="ui-btn ui-btn-light" href="${seguro(wa)}?text=${msg}" target="_blank" rel="noopener noreferrer">WhatsApp de ${seguro(primeiro)}</a>` : ''}
                        ${insta ? `<a class="ui-btn ui-btn-ghost" href="${seguro(insta)}" target="_blank" rel="noopener noreferrer">Instagram</a>` : ''}
                        ${mail ? `<a class="ui-btn ui-btn-ghost" href="mailto:${seguro(mail)}">E-mail</a>` : ''}
                    </div>
                </div>
            </div>
            <p class="ui-perfil-voltar"><a href="#imoveis">← Ver todos os imóveis da Arbor</a></p>
            <h2 class="ui-perfil-titulo">Imóveis de ${seguro(primeiro)}</h2>`;
        box.hidden = false;
        el('catalogo-view').classList.remove('ui-resp-carregando');
        box.querySelector('.ui-perfil-foto img')?.addEventListener('error', ev => ev.target.remove());
        el('catalogo-view').classList.add('ui-catalogo--resp');
        document.title = m.nome + ' · Imóveis · Arbor Imóveis';
    }
    function perfilAviso(texto, erro) {
        const box = el('resp-perfil'), view = el('catalogo-view');
        if (!box || !view) return;
        box.innerHTML = `<div class="ui-perfil-card"><div class="ui-perfil-info"><span class="ui-perfil-eyebrow">Responsável pelos imóveis</span><h1>${seguro(texto)}</h1>${erro ? '<div class="ui-perfil-acoes"><button type="button" class="ui-btn ui-btn-light" id="resp-retry">Tentar novamente</button><a class="ui-btn ui-btn-ghost" href="#imoveis">Ver todos os imóveis</a></div>' : ''}</div></div>`;
        box.hidden = false;
        view.classList.add('ui-catalogo--resp', 'ui-resp-carregando');
        box.querySelector('#resp-retry')?.addEventListener('click', carregar);
    }
    function mensagemVazia() {
        if (!selecionado) return '';
        const primeiro = selecionado.nome.split(/\s+/)[0];
        const wa = /^https:\/\/wa\.me\/55[1-9]\d{9,10}$/.test(selecionado.whatsapp || '') ? selecionado.whatsapp : 'https://wa.me/5562984854468';
        return `<div class="system-msg" role="status"><strong>${seguro(primeiro)} não tem imóveis disponíveis no site neste momento.</strong><p>Fale diretamente para conhecer outras opções e novidades do portfólio.</p><a class="ui-btn ui-btn-primary" href="${seguro(wa)}" target="_blank" rel="noopener noreferrer">Falar com ${seguro(primeiro)}</a> <a class="ui-btn ui-btn-outline" href="#imoveis">Ver todos os imóveis</a></div>`;
    }
    function atualizarFaixa() {
        const faixa = el('equipe-carteira');
        faixa.hidden = !selecionado;
        el('equipe-carteira-nome').textContent = selecionado ? 'Imóveis de ' + selecionado.nome : '';
    }
    function filtrar(imoveis) {
        if (!selecionado) return imoveis;
        if (!state.feedReal) return [];
        const ids = carteira(selecionado);
        return imoveis.filter(p => ids.has(codigo(p.id)));
    }
    function limpar() {
        selecionado = null;
        limparPerfil();
        atualizarFaixa();
        if (location.hash.startsWith('#equipe=')) history.replaceState(null, '', '#imoveis');
    }
    function rotear(hash) {
        if (hash === '#equipe') { limpar(); applyFilters(); showView('equipe-view'); window.scrollTo(0, 0); return true; }
        if (!hash.startsWith('#equipe=')) return false;
        showView('catalogo-view');
        if (!carregou) { el('equipe-status').textContent = 'Carregando equipe…'; if (falhou) perfilAviso('Não foi possível carregar este perfil agora.', true); else perfilAviso('Carregando perfil…'); return true; }
        let id;
        try { id = decodeURIComponent(hash.slice(8)); } catch { id = ''; }
        const membro = membros.find(m => m.id === id);
        if (!membro) { selecionado = null; atualizarFaixa(); applyFilters(); perfilAviso('Este perfil não está disponível.', false); const box = el('resp-perfil'); box.querySelector('.ui-perfil-info').insertAdjacentHTML('beforeend', '<div class="ui-perfil-acoes"><a class="ui-btn ui-btn-light" href="#imoveis">Ver todos os imóveis</a><a class="ui-btn ui-btn-ghost" href="#equipe">Conhecer a equipe</a></div>'); document.title = 'Perfil não encontrado · Arbor Imóveis'; return true; }
        // Começar a carteira sem filtros antigos evita ocultar imóveis do corretor.
        el('btn-reset').click();
        history.replaceState(null, '', hash);
        selecionado = membro;
        state.fromHash = hash;
        atualizarFaixa();
        mostrarPerfil(membro);
        applyFilters();
        window.scrollTo(0, 0);
        return true;
    }
    async function carregar() {
        if (carregando) return;
        carregando = true; falhou = false;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);
        el('equipe-status').textContent = 'Carregando equipe…';
        try {
            const url = new URL('/api/site/equipe', ARBOR_DATA_URL);
            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) throw new Error('Equipe indisponível');
            const data = await response.json();
            if (!Array.isArray(data.membros)) throw new Error('Resposta inválida');
            membros = data.membros.filter(m => m && typeof m.id === 'string' && typeof m.nome === 'string' && Array.isArray(m.imoveis) && m.imoveis.every(c => typeof c === 'string') && ['comercial','administrativo'].includes(m.grupo));
            carregou = true; falhou = false;
            renderizar();
            document.dispatchEvent(new Event('arbor:equipe'));
            if (location.hash.startsWith('#equipe=')) rotear(location.hash);
        } catch {
            falhou = true;
            el('equipe-status').textContent = 'Não foi possível carregar a equipe. Tente novamente em instantes.';
            if (location.hash.startsWith('#equipe=')) perfilAviso('Não foi possível carregar este perfil agora.', true);
            el('equipe-retry').hidden = false;
        } finally { clearTimeout(timeout); carregando = false; }
    }
    const responsavel = id => {
        const c = codigo(id);
        const m = membros.find(x => x.grupo === 'comercial' && carteira(x).has(c)) || membros.find(x => carteira(x).has(c));
        if (!m) return null;
        return { id: m.id, nome: m.nome, foto: fotoSegura(m.foto), creci: m.grupo === 'comercial' ? m.creci || '' : '', whatsapp: /^https:\/\/wa\.me\/55[1-9]\d{9,10}$/.test(m.whatsapp || '') ? m.whatsapp : '' };
    };
    window.ArborEquipe = { responsavel, mensagemVazia, selecionado: () => selecionado, sairDoPerfil: () => { const tinha = selecionado; limpar(); if (tinha) applyFilters(); }, filtrar, limpar, rotear, atualizar: () => { if (carregou) { renderizar(); if (selecionado) applyFilters(); } } };
    document.addEventListener('DOMContentLoaded', () => {
        el('equipe-retry').addEventListener('click', carregar);
        el('equipe-ver-todos').addEventListener('click', () => { limpar(); applyFilters(); });
        el('nav-equipe-btn').addEventListener('click', e => { e.preventDefault(); location.hash = 'equipe'; rotear('#equipe'); });
        carregar();
    });
})();
