#!/usr/bin/env python3
"""Agrega notícias do mercado imobiliário (Goiânia e região, financiamento,
lançamentos, regras e mercado nacional) e grava em noticias.json.

Fonte: Google News RSS (só título, veículo, data e link — o clique leva à matéria original).
Uso: python3 scripts/update_news.py            (rede real)
     python3 scripts/update_news.py --offline arquivo.xml   (teste com RSS local)
Somente biblioteca padrão.
"""
import base64
import html
import json
import re
import sys
import unicodedata
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "noticias.json"
MAX_AGE_DAYS = 30      # idade máxima de uma notícia nova
KEEP_DAYS = 45         # quanto tempo manter no histórico
MAX_ITEMS = 150
PER_QUERY = 25
IMG_PER_RUN = 80       # quantas matérias novas tentamos enriquecer por execução
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"

# (consulta, janela)
QUERIES = [
    '"mercado imobiliário" Goiânia',
    '"mercado imobiliário" Goiás',
    'Setor Marista OR "Setor Bueno" OR "Jardim Goiás" imóveis',
    'incorporadora Goiás lançamento',
    'Sinduscon-GO OR Secovi-GO OR Creci-GO',
    'financiamento imobiliário Goiás',
    'imóveis Goiânia lançamento',
    'construção civil Goiás',
    'incorporadora Goiânia lançamento empreendimento',
    'Aparecida de Goiânia imóveis',
    'Plano Diretor Goiânia',
    'financiamento imobiliário',
    'crédito imobiliário Caixa taxa',
    'Minha Casa Minha Vida',
    'FGTS financiamento imóvel',
    'lançamentos imobiliários incorporadoras',
    'mercado imobiliário Brasil vendas',
    'Secovi OR Abrainc OR CBIC OR Fipezap',
    'ITBI OR IPTU OR "reforma tributária" imóveis',
    'IPTU OR ITBI OR ISTI site:goiania.go.gov.br',
    'IPTU OR ITBI site:senadorcanedo.go.gov.br',
    'IPTU OR ITBI site:hidrolandia.go.gov.br',
    'IPTU OR ITBI site:aparecida.go.gov.br',
    'IPTU OR ITBI site:anapolis.go.gov.br',
    'IPTU OR ITBI site:trindade.go.gov.br',
    'registro de imóveis cartórios Goiás ONR',
]

RELEVANT = re.compile(
    r"imobili|imovel|imoveis|apartament|moradia|habitac|construcao civil|construtora|incorporad|"
    r"empreendimento residencial|casa propria|minha casa minha vida|"
    r"aluguel|loteamento|condominio|residencial|cyrela|mrv|tenda|direcional|secovi|abrainc|"
    r"cbic|fipezap|creci|itbi|isti|iptu|plano diretor|alto padrao|vgv|sbpe|registro de imoveis"
)
LOCAL_TITLE = re.compile(r"goiania|goias|goiano|aparecida de goiania|anapolis|senador canedo|hidrolandia|trindade|goianira")
LOCAL_SOURCES = re.compile(r"o popular|jornal opcao|mais goias|diario de goias|goias|sebrae go|sinduscon-go|secovi-go|creci-go|goiania|senador canedo|hidrolandia|anapolis|trindade")
CATEGORIES = [  # ordem = prioridade
    ("regras", re.compile(r"\blei\b|decreto|plano diretor|itbi|isti|iptu|regra|norma|reforma tributaria|stj|stf|cartorio|registro de imoveis|resolucao|projeto de lei|tributa|imposto")),
    ("lancamentos", re.compile(r"lanc|empreendimento|incorporadora|novo residencial|vgv|entrega de obra|canteiro")),
    ("financiamento", re.compile(r"financ|credito|juros|selic|fgts|caixa|minha casa|taxa|consorcio|sbpe|poupanca|parcela")),
    ("regras", re.compile(r"\blei\b|decreto|plano diretor|itbi|iptu|regra|norma|reforma tributaria|stj|stf|cartorio|resolucao|mudanc|projeto de lei|tributa|imposto")),
]


# manchetes que não interessam ao leitor da Arbor
EXCLUDE = re.compile(r"leilao|leiloa|leiloes|arremat|lances digitais|cargos e salarios|vagas? de emprego|curso gratuito|futebol|atletico-go|serra dourada|estadio|financiamento de veiculo|credito consignado|lancamento de album")
EXCLUDE_SOURCES = re.compile(r"instagram|facebook|youtube|tiktok|linkedin|kwai|portal salario|pinterest|reddit")
# estados/capitais de fora: só descartam notícia que NÃO é de Goiás
OTHER_PLACES = re.compile(
    r"rondonia|acre\b|amazonas|roraima|amapa|para\b|tocantins|maranhao|piaui|ceara|rio grande do norte|paraiba|pernambuco|"
    r"alagoas|sergipe|bahia|minas gerais|espirito santo|parana|santa catarina|rio grande do sul|mato grosso|"
    r"porto velho|manaus|belem|fortaleza|recife|salvador|natal|joao pessoa|maceio|aracaju|teresina|sao luis|curitiba|"
    r"florianopolis|porto alegre|belo horizonte|vitoria|cuiaba|campo grande|palmas|boa vista|macapa|rio branco|"
    r"rio de janeiro|florianopolis|balneario|camboriu"
)


def clean_source(src):
    """Google às vezes devolve o domínio no lugar do nome do veículo."""
    src = src.strip()
    if " " not in src and "." in src:
        host = re.sub(r"^www\.", "", src.lower()).split(".")[0]
        return host.replace("-", " ").title()
    return src


def norm(s):
    s = unicodedata.normalize("NFKD", s)
    return "".join(c for c in s if not unicodedata.combining(c)).lower()


def fetch(query):
    q = urllib.parse.quote(f"{query} when:{MAX_AGE_DAYS}d")
    url = f"https://news.google.com/rss/search?q={q}&hl=pt-BR&gl=BR&ceid=BR:pt-419"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (ArborJournal)"})
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read()


def parse(xml_bytes):
    root = ET.fromstring(xml_bytes)
    for it in list(root.iterfind(".//item"))[:PER_QUERY]:
        title = (it.findtext("title") or "").strip()
        link = (it.findtext("link") or "").strip()
        pub = it.findtext("pubDate")
        src_el = it.find("source")
        source = (src_el.text or "").strip() if src_el is not None else ""
        if source and title.endswith(" - " + source):
            title = title[: -len(source) - 3].strip()
        elif " - " in title and not source:
            title, source = title.rsplit(" - ", 1)
        try:
            dt = parsedate_to_datetime(pub).astimezone(timezone.utc)
        except Exception:
            continue
        if title and link.startswith("https://"):
            yield {"title": title, "url": link, "source": source or "Fonte", "date": dt}


def classify(title, source):
    t, s = norm(title), norm(source)
    if not RELEVANT.search(t) or EXCLUDE.search(t) or EXCLUDE_SOURCES.search(s):
        return None
    cat = "mercado"
    for name, rx in CATEGORIES:
        if rx.search(t):
            cat = name
            break
    local = bool(LOCAL_TITLE.search(t) or LOCAL_SOURCES.search(s))
    if not local and OTHER_PLACES.search(t):
        return None
    return cat, local


# ---------- imagem de capa da matéria ----------
def http_get(url, limit=400_000, timeout=8):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "pt-BR,pt;q=0.9"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.geturl(), r.read(limit).decode("utf-8", "ignore")


def gnews_real_url(url):
    """O RSS do Google News traz um link intermediário; descobre o endereço real da matéria."""
    m = re.search(r"/(?:rss/)?articles/([^?/]+)", url)
    if not m:
        return url
    art = m.group(1)
    try:  # formato antigo: o endereço vai codificado dentro do próprio id
        raw = base64.urlsafe_b64decode(art + "=" * (-len(art) % 4))
        found = re.search(rb"https?://[\x21-\x7e]+", raw)
        if found:
            return found.group(0).decode()
    except Exception:
        pass
    _, page = http_get(f"https://news.google.com/rss/articles/{art}")
    sig = re.search(r'data-n-a-sg="([^"]+)"', page)
    ts = re.search(r'data-n-a-ts="([^"]+)"', page)
    if not (sig and ts):
        raise ValueError("parâmetros do Google News não encontrados")
    inner = ('["garturlreq",[["X","X",["X","X"],null,null,1,1,"US:en",null,1,null,null,null,null,null,0,1],'
             f'"X","X",1,[1,1,1],1,1,null,0,0,null,0],"{art}",{ts.group(1)},"{sig.group(1)}"]')
    body = "f.req=" + urllib.parse.quote(json.dumps([[["Fbv4je", inner]]]))
    req = urllib.request.Request(
        "https://news.google.com/_/DotsSplashUi/data/batchexecute", data=body.encode(),
        headers={"User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"})
    with urllib.request.urlopen(req, timeout=10) as r:
        txt = r.read().decode("utf-8", "ignore")
    return json.loads(json.loads(txt.split("\n\n")[1])[0][2])[1]


def og_image(page, base):
    for rx in (
        r'<meta[^>]+(?:property|name)=["\'](?:og:image(?::secure_url)?|twitter:image(?::src)?)["\'][^>]*content=["\']([^"\']+)',
        r'<meta[^>]+content=["\']([^"\']+)["\'][^>]*(?:property|name)=["\'](?:og:image|twitter:image)["\']',
    ):
        m = re.search(rx, page, re.I)
        if m:
            img = urllib.parse.urljoin(base, html.unescape(m.group(1).strip()))
            if img.startswith("https://") and not re.search(r"logo|favicon|placeholder|default", img, re.I):
                return img
    return ""


def enrich(item):
    """Preenche item['img'] (e troca o link pelo endereço real, se descoberto). Nunca levanta erro."""
    item["img"] = ""
    try:
        real = gnews_real_url(item["url"]) if "news.google.com" in item["url"] else item["url"]
        if real.startswith("https://") and "news.google.com" not in real:
            item["url"] = real
            base, page = http_get(real)
            item["img"] = og_image(page, base)
    except Exception as e:
        print(f"aviso: sem imagem para '{item['title'][:50]}': {e}", file=sys.stderr)
    return item


def key(title):
    return re.sub(r"[^a-z0-9]+", " ", norm(title)).strip()[:90]


def main():
    now = datetime.now(timezone.utc)
    items, ok = {}, 0
    if "--offline" in sys.argv:
        feeds = [Path(sys.argv[sys.argv.index("--offline") + 1]).read_bytes()]
    else:
        feeds = []
        for q in QUERIES:
            try:
                feeds.append(fetch(q))
            except Exception as e:  # uma consulta falhar não derruba as outras
                print(f"aviso: '{q}' falhou: {e}", file=sys.stderr)
    for raw in feeds:
        try:
            parsed = list(parse(raw))
        except ET.ParseError as e:
            print(f"aviso: feed inválido: {e}", file=sys.stderr)
            continue
        ok += 1
        for n in parsed:
            if now - n["date"] > timedelta(days=MAX_AGE_DAYS) or n["date"] > now + timedelta(hours=2):
                continue
            c = classify(n["title"], n["source"])
            if not c:
                continue
            k = key(n["title"])
            if k in items:
                continue
            items[k] = {
                "title": n["title"], "url": n["url"], "source": clean_source(n["source"]),
                "date": n["date"].strftime("%Y-%m-%dT%H:%M:%SZ"),
                "cat": c[0], "local": c[1],
            }
    if ok == 0:
        print("erro: nenhuma fonte respondeu; mantendo noticias.json atual", file=sys.stderr)
        return 1

    # histórico: mantém o que já estava salvo (sem duplicar) e poda o antigo
    if OUT.exists():
        try:
            for old in json.loads(OUT.read_text("utf-8")).get("items", []):
                c = classify(old["title"], old["source"])
                if not c:
                    continue
                old.update(cat=c[0], local=c[1], source=clean_source(old["source"]))
                items.setdefault(key(old["title"]), old)
        except Exception:
            pass
    cutoff = (now - timedelta(days=KEEP_DAYS)).strftime("%Y-%m-%dT%H:%M:%SZ")
    final = sorted((i for i in items.values() if i["date"] >= cutoff), key=lambda i: i["date"], reverse=True)[:MAX_ITEMS]
    pending = [i for i in final if "img" not in i][:IMG_PER_RUN]
    if pending and "--offline" not in sys.argv:
        with ThreadPoolExecutor(max_workers=8) as ex:
            list(ex.map(enrich, pending))
        print(f"imagens: {sum(1 for i in pending if i['img'])}/{len(pending)} encontradas")
    OUT.write_text(
        json.dumps({"updated": now.strftime("%Y-%m-%dT%H:%M:%SZ"), "items": final}, ensure_ascii=False, indent=1) + "\n",
        "utf-8",
    )
    print(f"{len(final)} notícias gravadas em {OUT.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

