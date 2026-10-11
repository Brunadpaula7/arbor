# CORS das fotos (para as 5 fotos aparecerem na ficha em PDF)

A ficha em PDF desenha as fotos em um canvas. O navegador só permite isso se o
armazenamento das fotos (Firebase Storage / Google Cloud Storage) responder com
o cabeçalho CORS para o site da Arbor. Sem isso, as fotos ficam de fora do PDF.

## 1. Descobrir o nome do bucket
Abra um imóvel no site, clique com o botão direito na foto > "Copiar endereço da imagem".
- `https://firebasestorage.googleapis.com/v0/b/NOME-DO-BUCKET/o/...` → o bucket é `NOME-DO-BUCKET`
- `https://storage.googleapis.com/NOME-DO-BUCKET/...` → idem
(normalmente termina em `.appspot.com` ou `.firebasestorage.app`)

## 2. Aplicar (Google Cloud Shell, em console.cloud.google.com, logado na conta do projeto)
```
gcloud storage buckets update gs://NOME-DO-BUCKET --cors-file=cors.json
```
Alternativa: `gsutil cors set cors.json gs://NOME-DO-BUCKET`
(envie antes o `cors.json` desta pasta pelo botão de upload do Cloud Shell.)

## 3. Conferir
```
gcloud storage buckets describe gs://NOME-DO-BUCKET --format="default(cors_config)"
curl -sI -H "Origin: https://www.arborimoveis.com.br" "URL-DE-UMA-FOTO" | grep -i access-control
```
Deve aparecer `access-control-allow-origin`. Depois gere a ficha em PDF novamente
(atualize a página sem cache).

Só leitura (GET/HEAD) e só para os domínios da Arbor; as fotos já são públicas.
