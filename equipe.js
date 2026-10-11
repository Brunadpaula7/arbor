/* Equipe pública: cadastro e carteiras vêm do ERP, nunca de uma lista manual. */
(() => {
    let membros = [], selecionado = null, carregando = false, carregou = false;
    const el = id => document.getElementById(id);
    const seguro = valor => String(valor || '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
    const fotoSegura = valor => { try { const u = new URL(valor); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; } };
    const codigo = valor => String(valor || '').trim().toUpperCase();
    const carteira = membro => new Set(membro.imoveis.map(codigo));
    const quantidade = membro => state.feedReal ? state.all.filter(p => carteira(membro).has(codigo(p.id))).length : 0;

    function renderizar() {
        for (const grupo of ['comercial', 'administrativo']) {
            const lista = membros.filter(m => m.grupo === grupo);
            el('equipe-' + grupo).replaceChildren();
            lista.forEach(m => {
                const card = document.createElement(m.grupo === 'comercial' ? 'a' : 'article');
                card.className = 'equipe-card';
                if (m.grupo === 'comercial') card.href = '#equipe=' + encodeURIComponent(m.id);
                const foto = fotoSegura(m.foto);
                const iniciais = m.nome.split(/\s+/).filter(Boolean).slice(0, 2).map(n => n[0]).join('');
                card.innerHTML = `<div class="equipe-retrato"><span aria-hidden="true">${seguro(iniciais)}</span>${foto ? `<img src="${seguro(foto)}" alt="${seguro(m.nome)}" loading="lazy">` : ''}</div><div class="equipe-info"><h3>${seguro(m.nome)}</h3><p>${seguro(m.cargo)}</p>${m.grupo === 'comercial' && m.creci ? `<small>CRECI ${seguro(m.creci)}</small>` : ''}${m.grupo === 'comercial' ? `<span class="equipe-link">Ver imóveis <span aria-hidden="true">↗</span></span><small>${quantidade(m)} imóveis disponíveis</small>` : ''}</div>`;
                card.querySelector('img')?.addEventListener('error', e => e.target.remove());
                el('equipe-' + grupo).appendChild(card);
            });
            el('equipe-' + grupo + '-bloco').hidden = !lista.length;
        }
        el('equipe-status').textContent = membros.length ? '' : 'A equipe será apresentada aqui em breve.';
        el('equipe-retry').hidden = true;
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
        atualizarFaixa();
        if (location.hash.startsWith('#equipe=')) history.replaceState(null, '', '#busca-completa');
    }
    function rotear(hash) {
        if (hash === '#equipe') { limpar(); applyFilters(); showView('list-view'); requestAnimationFrame(() => el('equipe').scrollIntoView({ behavior: 'smooth' })); return true; }
        if (!hash.startsWith('#equipe=')) return false;
        showView('list-view');
        if (!carregou) { el('equipe-status').textContent = 'Carregando equipe…'; requestAnimationFrame(() => el('equipe').scrollIntoView({ behavior: 'smooth' })); return true; }
        let id;
        try { id = decodeURIComponent(hash.slice(8)); } catch { id = ''; }
        const membro = membros.find(m => m.id === id && m.grupo === 'comercial');
        if (!membro) { limpar(); applyFilters(); goHome('equipe'); return true; }
        // Começar a carteira sem filtros antigos evita ocultar imóveis do corretor.
        el('btn-reset').click();
        history.replaceState(null, '', hash);
        selecionado = membro;
        atualizarFaixa();
        applyFilters();
        requestAnimationFrame(() => el('busca-completa').scrollIntoView({ behavior: 'smooth', block: 'start' }));
        return true;
    }
    async function carregar() {
        if (carregando) return;
        carregando = true;
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
            carregou = true;
            renderizar();
            if (location.hash.startsWith('#equipe=')) rotear(location.hash);
        } catch {
            el('equipe-status').textContent = 'Não foi possível carregar a equipe. Tente novamente em instantes.';
            el('equipe-retry').hidden = false;
        } finally { clearTimeout(timeout); carregando = false; }
    }
    window.ArborEquipe = { filtrar, limpar, rotear, atualizar: () => { if (carregou) { renderizar(); if (selecionado) applyFilters(); } } };
    document.addEventListener('DOMContentLoaded', () => {
        el('equipe-retry').addEventListener('click', carregar);
        el('equipe-ver-todos').addEventListener('click', () => { limpar(); applyFilters(); });
        el('nav-equipe-btn').addEventListener('click', e => { e.preventDefault(); location.hash = 'equipe'; rotear('#equipe'); });
        carregar();
    });
})();
