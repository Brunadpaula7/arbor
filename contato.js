/* Contato com a Arbor: formulário da página "Nossa essência" e envio compartilhado
   com o formulário de cada imóvel (imovel-contato.js).
   Envia para o servidor da Arbor (Cloudflare Worker), que entrega a mensagem
   em contato@arborimoveis.com.br pelo mesmo sistema de e-mails da Arbor.
   Se o servidor não responder, abre o e-mail do visitante com a mensagem pronta. */
(function () {
    'use strict';
    var DESTINO = 'contato@arborimoveis.com.br';
    var ENDPOINT = 'https://arbor-backend.arborimoveis-bruna.workers.dev/api/public/contato';

    function emailValido(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }

    /* Envia ao servidor. Resolve se a Arbor recebeu; rejeita com Error('muitas') ou Error('falha'). */
    function enviar(dados) {
        return fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(dados)
        }).then(function (r) {
            return r.json().catch(function () { return {}; }).then(function (j) {
                if (r.status === 429) throw new Error('muitas');
                if (!r.ok || j.ok === false) throw new Error('falha');
            });
        });
    }

    /* Plano B: abre o e-mail do visitante já preenchido para contato@, para a mensagem não se perder. */
    function abrirEmail(assunto, corpo) {
        window.location.href = 'mailto:' + DESTINO + '?subject=' + encodeURIComponent(assunto) + '&body=' + encodeURIComponent(String(corpo).slice(0, 1500));
    }

    /* Liga um formulário de contato (mesmos campos: nome, e-mail, telefone, mensagem, aceite) ao envio. */
    function ligar(form, status, botao) {
        function aviso(texto, tipo) {
            status.textContent = texto;
            status.className = 'ui-contato-status' + (tipo ? ' is-' + tipo : '');
        }

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

            enviar({ nome: nome, email: email, telefone: telefone, mensagem: mensagem, aceite: true, website: '' })
                .then(function () {
                    form.reset();
                    aviso('Mensagem enviada. Obrigado! Retornaremos em breve.', 'ok');
                })
                .catch(function (err) {
                    if (err && err.message === 'muitas') return aviso('Muitas tentativas seguidas. Aguarde alguns minutos ou chame no WhatsApp.', 'erro');
                    aviso('Não conseguimos enviar pelo site agora. Abrimos o seu e-mail com a mensagem pronta para ' + DESTINO + ' — é só enviar. Se preferir, chame no WhatsApp.', 'erro');
                    abrirEmail('Mensagem pelo site Arbor — ' + nome, 'Nome: ' + nome + '\nE-mail: ' + email + '\nTelefone / WhatsApp: ' + (telefone || '—') + '\n\n' + mensagem);
                })
                .then(function () { botao.disabled = false; });
        });
    }

    window.ArborContato = { enviar: enviar, abrirEmail: abrirEmail, emailValido: emailValido, destino: DESTINO, ligar: ligar };

    // Página "Nossa essência"
    var form = document.getElementById('form-contato');
    if (form) ligar(form, document.getElementById('contato-status'), document.getElementById('contato-enviar'));

    // Convite da página inicial: o botão "Enviar mensagem" abre/fecha o formulário
    var formConvite = document.getElementById('form-convite');
    var abrirConvite = document.getElementById('convite-abrir');
    if (formConvite && abrirConvite) {
        var caixa = document.getElementById('convite-form-wrap');
        ligar(formConvite, document.getElementById('convite-status'), document.getElementById('convite-enviar'));
        abrirConvite.addEventListener('click', function () {
            var abrir = caixa.hidden;
            caixa.hidden = !abrir;
            abrirConvite.setAttribute('aria-expanded', abrir ? 'true' : 'false');
            if (abrir) {
                caixa.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                setTimeout(function () { formConvite.elements.nome.focus({ preventScroll: true }); }, 250);
            }
        });
    }
})();
