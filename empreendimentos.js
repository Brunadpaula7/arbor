/* Somente nomes de empreendimentos de imóveis liberados para o site. */
(() => {
    const nomes = Object.create(null);
    window.ArborEmpreendimentos = { nomes, pronto: null };
    const carregar = async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);
        try {
            const response = await fetch(new URL('/api/site/empreendimentos', ARBOR_DATA_URL), { signal: controller.signal });
            if (!response.ok) return;
            const data = await response.json();
            if (!Array.isArray(data.empreendimentos)) return;
            for (const item of data.empreendimentos) {
                if (!item || typeof item.codigo !== 'string' || !/^AR-\d+$/.test(item.codigo) || typeof item.nome !== 'string') continue;
                const nome = nomeEmpreendimentoPublico(item.nome);
                if (nome) nomes[item.codigo] = nome;
            }
            window.ArborAtualizarEmpreendimentos?.();
        } catch { /* O título público existente continua disponível. */ }
        finally { clearTimeout(timeout); }
    };
    document.addEventListener('DOMContentLoaded', () => { window.ArborEmpreendimentos.pronto = carregar(); });
})();
