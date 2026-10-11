# Journal Arbor — fontes e manutenção

Revisão editorial: 11 de outubro de 2026.

As manchetes em `noticias.json` mantêm título, veículo, data e link de origem. O agregador busca RSS do Google News, incluindo consultas restritas às prefeituras de Goiânia, Senador Canedo, Hidrolândia, Aparecida de Goiânia, Anápolis e Trindade. A classificação exige relação com imóveis ou tributos imobiliários e descarta esportes, crédito genérico, redes sociais e leilões. Execute `python3 scripts/test_news.py` antes de alterar os filtros.

Os guias e os comunicados selecionados em `journal-services.js` são editoriais: a data de conferência não deve ser renovada automaticamente. O código identifica prazos encerrados pelo calendário de São Paulo. Não reativar benefícios de 2026 em exercícios posteriores. Para adicionar município ou atualizar desconto, revisar o comunicado e a legislação indicada pela fonte. Notícias sem data precisa de publicação são identificadas pelo exercício, sem inventar o dia.

## Fontes primárias

- Goiânia, IPTU/ITU: https://www.goiania.go.gov.br/sing_servicos/emissao-duam-itu-iptu-issqn/
- Goiânia, cadastro/valor venal: https://www.goiania.go.gov.br/Sistemas/Siptu/asp/siptu00000f0.asp
- Goiânia, portal ITBI: https://www.goiania.go.gov.br/sistemas/SISTI/asp/sisti00000f0.asp
- Goiânia, ISTI: https://www.goiania.go.gov.br/sefaz/departamentos/gerencia-de-lancamento-do-imposto-sobre-transmissao-de-imoveis/
- Goiânia, perguntas ITBI: https://www.goiania.go.gov.br/sistemas/sisti/html/sisti00099h1.htm
- Senador Canedo: https://senadorcanedo.go.gov.br/iptu-itu-e-itbi/
- Senador Canedo, aviso de abril: https://senadorcanedo.go.gov.br/ultimos-dias-para-garantir-20-de-desconto-no-iptu-2026-em-senador-canedo/
- Hidrolândia, IPTU: https://www.hidrolandia.go.gov.br/servico/emissao-de-iptu/
- Hidrolândia, avaliação de ITBI: https://www.hidrolandia.go.gov.br/servico/vaptvupt-avaliacao-de-itbi/
- Aparecida, IPTU 2026: https://aparecida.go.gov.br/iptu-e-itu-2026-ja-estao-disponiveis-no-site-da-prefeitura-de-aparecida
- Aparecida, ITBI temporário: https://aparecida.go.gov.br/reducao-do-itbi-em-aparecida-comecou-nesta-segunda-feira-com-aliquota-de-15
- Anápolis, serviços: https://portaldocidadao.anapolis.go.gov.br/
- Anápolis, prorrogação IPTU: https://www.anapolis.go.gov.br/prazo-para-pagamento-do-iptu-e-itu-com-desconto-em-anapolis-e-prorrogado-ate-30-de-abril/
- Trindade, IPTU/resíduos: https://trindade.go.gov.br/prefeitura-de-trindade-disponibiliza-iptu-2026-com-descontos-de-ate-25-e-nova-forma-de-cobranca-da-tarifa-de-residuos-solidos/
- Trindade, serviços: https://trindade.go.gov.br/servicos/
- CNJ, cartórios: https://www.cnj.jus.br/cnj-servico-conheca-os-tipos-de-cartorios-existentes-no-brasil/
- CNJ, cadastro: https://justicaaberta.cnj.jus.br/
- CNJ, SREI: https://www.cnj.jus.br/sistemas/srei-2/
- ONR: https://registradores.onr.org.br/
- Registro de Imóveis do Brasil: https://www.registrodeimoveis.org.br/servicos

## Limites

O site não acessa débitos, dados pessoais ou cadastros privados das prefeituras. Valores de IPTU da ficha do imóvel vêm do feed da Arbor; o município confirma o valor oficial. O site não calcula ITBI: alíquotas, base, benefícios e condições dependem do município e da operação. Não há taxa ou desconto presumido para Hidrolândia ou outro município sem fonte.

Jost é distribuída localmente sob a licença OFL em `assets/Jost-OFL.txt`. Os PNGs de `assets/icons/` são os originais fornecidos pela Arbor; o SVG da interface apenas enquadra a área visível, sem modificar os arquivos.
