/* Formulário de contato (página "Nossa essência").
   Envia para o servidor da Arbor (Cloudflare Worker), que entrega a mensagem
   em contato@arborimoveis.com.br pelo mesmo sistema de e-mails da Arbor. */
(function () {
    'use strict';
    var DESTINO = 'contato@arborimoveis.com.br';
    var ENDPOINT = 'https://arbor-backend.arborimoveis-bruna.workers.dev/api/public/contato';
    var form = document.getElementById('form-contato');
    if (!form) return;

    var status = document.getElementById('contato-status');
    var botao = document.getElementById('contato-enviar');

    function aviso(texto, tipo) {
        status.textContent = texto;
        status.className = 'ui-contato-status' + (tipo ? ' is-' + tipo : '');
    }

    function emailValido(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var d = new FormData(form);
        if (d.get('website')) return; // robô: ignora sem avisar

        var nome = String(d.get('nome') || '').trim();
        var email = String(d.get('email') || '').trim();
        var telefone = String(d.get('telefone') || '').trim();
        var mensagem = String(d.get('mensagem') || '').trim();

        if (!nome || !mensagem) return aviso('Preencha seu nome e a mensagem.', 'erro');
        if (!emailValido(email)) return aviso('Informe um e-mail válido para retornarmos.', 'erro');
        if (!form.elements.aceite.checked) return aviso('Marque a concordância com a Política de Privacidade para enviar.', 'erro');

        botao.disabled = true;
        aviso('Enviando…');

        fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ nome: nome, email: email, telefone: telefone, mensagem: mensagem, aceite: true, website: '' })
        }).then(function (r) {
            return r.json().catch(function () { return {}; }).then(function (j) {
                if (r.status === 429) throw new Error('muitas');
                if (!r.ok || j.ok === false) throw new Error('falha');
                form.reset();
                aviso('Mensagem enviada. Obrigado! Retornaremos em breve.', 'ok');
            });
        }).catch(function (err) {
            if (err && err.message === 'muitas') return aviso('Muitas tentativas seguidas. Aguarde alguns minutos ou chame no WhatsApp.', 'erro');
            aviso('Não foi possível enviar agora. Escreva para ' + DESTINO + ' ou chame no WhatsApp.', 'erro');
        }).then(function () { botao.disabled = false; });
    });
})();
