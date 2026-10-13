/* Contato sobre um imóvel específico (página do imóvel): mensagem ou "Desejo visitar".
   Usa o envio compartilhado de contato.js (window.ArborContato). A mensagem já segue
   com o código, o título e o link do imóvel, para a equipe saber exatamente de qual se trata. */
(function () {
    'use strict';
    var SITE = 'https://www.arborimoveis.com.br/';

    function definirModo(form, modo) {
        form.setAttribute('data-modo', modo);
        var visita = modo === 'visita';
        form.parentNode.querySelectorAll('.ic-modo').forEach(function (b) {
            var ativo = b.getAttribute('data-modo') === modo;
            b.classList.toggle('is-ativo', ativo);
            b.setAttribute('aria-pressed', ativo ? 'true' : 'false');
        });
        var msg = form.elements.mensagem;
        msg.required = !visita;
        msg.placeholder = visita ? 'Se quiser, conte o que gostaria de ver ou dúvidas para a visita (opcional).' : 'Escreva sua dúvida ou o que gostaria de saber sobre este imóvel.';
        form.elements.telefone.required = visita;
        form.querySelector('#ic-enviar').textContent = visita ? 'Solicitar visita' : 'Enviar mensagem';
        form.querySelector('.ic-tel-dica').hidden = !visita;
    }

    /* Abre o formulário no modo pedido (usado pelos botões "Desejo visitar" da página). */
    function abrir(modo) {
        var form = document.getElementById('form-imovel');
        if (!form) return;
        definirModo(form, modo === 'visita' ? 'visita' : 'mensagem');
        var alvo = document.getElementById('imovel-contato');
        alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(function () { var c = form.elements.nome; if (c && !c.value) c.focus({ preventScroll: true }); }, 450);
    }

    function montar(imovel) {
        var form = document.getElementById('form-imovel');
        if (!form || !window.ArborContato) return;
        var C = window.ArborContato;
        var status = document.getElementById('imovel-status');
        var botao = document.getElementById('ic-enviar');
        var codigo = String(imovel.codigo || ''), titulo = String(imovel.titulo || '').slice(0, 120);
        var url = SITE + '#id=' + encodeURIComponent(codigo);

        definirModo(form, 'mensagem');
        document.querySelectorAll('#imovel-contato .ic-modo').forEach(function (b) {
            b.addEventListener('click', function () { definirModo(form, b.getAttribute('data-modo')); });
        });
        document.querySelectorAll('[data-ic-abrir]').forEach(function (b) {
            b.addEventListener('click', function (e) { e.preventDefault(); abrir(b.getAttribute('data-ic-abrir')); });
        });

        function aviso(texto, tipo) { status.textContent = texto; status.className = 'ui-contato-status' + (tipo ? ' is-' + tipo : ''); }

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var d = new FormData(form);
            if (d.get('website')) return; // robô
            var visita = form.getAttribute('data-modo') === 'visita';
            var nome = String(d.get('nome') || '').trim(), email = String(d.get('email') || '').trim(),
                telefone = String(d.get('telefone') || '').trim(), texto = String(d.get('mensagem') || '').trim();

            if (!nome) return aviso('Informe seu nome.', 'erro');
            if (!C.emailValido(email)) return aviso('Informe um e-mail válido para retornarmos.', 'erro');
            if (visita && telefone.replace(/\D/g, '').length < 10) return aviso('Informe seu WhatsApp com DDD para combinarmos a visita.', 'erro');
            if (!visita && !texto) return aviso('Escreva sua mensagem sobre o imóvel.', 'erro');
            if (!form.elements.aceite.checked) return aviso('Marque a concordância com a Política de Privacidade para enviar.', 'erro');

            var linhas = ['Imóvel: Cód. ' + codigo + (titulo ? ' — ' + titulo : ''), 'Link: ' + url];
            if (visita) linhas.push('Interesse: DESEJO VISITAR');
            linhas.push('', texto || 'Gostaria de agendar uma visita a este imóvel.');
            var mensagem = linhas.join('\n');

            botao.disabled = true;
            aviso('Enviando…');
            C.enviar({
                nome: nome, email: email, telefone: telefone, mensagem: mensagem, aceite: true, website: '',
                imovel: { codigo: codigo, titulo: titulo, url: url }, intencao: visita ? 'visita' : 'mensagem'
            }).then(function () {
                form.reset();
                definirModo(form, 'mensagem');
                aviso(visita ? 'Pedido de visita enviado. Nossa equipe retorna em breve para combinar a visita.' : 'Mensagem enviada. Obrigado! Retornaremos em breve.', 'ok');
            }).catch(function (err) {
                if (err && err.message === 'muitas') return aviso('Muitas tentativas seguidas. Aguarde alguns minutos ou chame no WhatsApp.', 'erro');
                aviso('Não conseguimos enviar pelo site agora. Abrimos o seu e-mail com a mensagem pronta para ' + C.destino + ' — é só enviar. Se preferir, chame no WhatsApp.', 'erro');
                C.abrirEmail((visita ? 'Visita ao imóvel ' : 'Mensagem sobre o imóvel ') + codigo + ' — ' + nome,
                    'Nome: ' + nome + '\nE-mail: ' + email + '\nTelefone / WhatsApp: ' + (telefone || '—') + '\n\n' + mensagem);
            }).then(function () { botao.disabled = false; });
        });
    }

    window.ArborImovelContato = { montar: montar, abrir: abrir };
})();
