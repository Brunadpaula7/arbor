/* Formulário de contato (página "Nossa essência").
   O site é estático (GitHub Pages), então o envio usa o FormSubmit, que encaminha
   a mensagem para o e-mail abaixo. Na primeira mensagem enviada, o FormSubmit manda
   um e-mail de ativação para este endereço: é preciso clicar no link uma única vez. */
(function () {
    'use strict';
    var DESTINO = 'contato@arborimoveis.com.br';
    var ENDPOINT = 'https://formsubmit.co/ajax/' + DESTINO;
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
        if (d.get('_honey')) return; // robô: ignora sem avisar

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
            body: JSON.stringify({
                _subject: 'Nova mensagem pelo site Arbor — ' + nome,
                _template: 'table',
                _captcha: 'false',
                Nome: nome,
                email: email,
                Telefone: telefone || 'não informado',
                Mensagem: mensagem
            })
        }).then(function (r) {
            return r.json().catch(function () { return {}; }).then(function (j) {
                if (!r.ok || j.success === 'false' || j.success === false) throw new Error('falha');
                form.reset();
                aviso('Mensagem enviada. Obrigado! Retornaremos em breve.', 'ok');
            });
        }).catch(function () {
            aviso('Não foi possível enviar agora. Escreva para ' + DESTINO + ' ou chame no WhatsApp.', 'erro');
        }).then(function () { botao.disabled = false; });
    });
})();
