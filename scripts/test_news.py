"""Limites editoriais que evitam notícias alheias ao mercado e tributos locais."""
import unittest
from update_news import classify

class EditorialTests(unittest.TestCase):
    def test_unrelated_headlines(self):
        for title in ['Atlético-GO anuncia construção no Serra Dourada', 'Caixa amplia crédito consignado', 'Lançamento de carro em Goiânia', 'FGTS: veja saldo e saque aniversário', 'Financiamento de veículo em Goiás']:
            with self.subTest(title=title): self.assertIsNone(classify(title,'Mais Goiás'))

    def test_local_tax_and_registration(self):
        for title in ['Hidrolândia divulga IPTU 2026', 'ITBI de Aparecida de Goiânia terá nova alíquota', 'Cartório de registro de imóveis em Anápolis muda atendimento', 'Goiânia publica guia de ISTI']:
            with self.subTest(title=title): self.assertEqual(classify(title,'Prefeitura'),('regras',True))

    def test_real_estate_and_housing(self):
        self.assertEqual(classify('Caixa amplia financiamento imobiliário com recursos do SBPE','Caixa'),('financiamento',False))
        self.assertEqual(classify('Incorporadora lança residencial em Goiânia','O Popular'),('lancamentos',True))
        self.assertEqual(classify('IPTU parcelado: prefeitura divulga calendário','Prefeitura de Senador Canedo'),('regras',True))

    def test_other_region_and_social_sources(self):
        self.assertIsNone(classify('IPTU em Curitiba tem desconto','Prefeitura'))
        self.assertIsNone(classify('Imóveis em Goiânia','Instagram'))

    def test_city_changes(self):
        for title in ['Prefeitura de Goiânia inicia obras do viaduto da T-63', 'BRT Norte-Sul de Goiânia tem novo trecho liberado', 'Parque Macambira Anicuns recebe revitalização em Goiânia']:
            with self.subTest(title=title): self.assertEqual(classify(title,'Mais Goiás'),('cidade',True))
        for title in ['Polícia prende suspeito em avenida de Goiânia', 'Acidente no Eixo Anhanguera em Goiânia', 'Obras em Curitiba avançam']:
            with self.subTest(title=title): self.assertIsNone(classify(title,'Mais Goiás'))

if __name__ == '__main__': unittest.main()
