#!/usr/bin/env python3
"""Agrega notícias do mercado imobiliário (Goiânia e região, financiamento,
lançamentos, regras e mercado nacional) e grava em noticias.json.

Fonte: Google News RSS (só título, veículo, data e link — o clique leva à matéria original).
Uso: python3 scripts/update_news.py            (rede real)
     python3 scripts/update_news.py --offline arquivo.xml   (teste com RSS local)
Somente biblioteca padrão.
"""
import json
import re
import sys
import unicodedata
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "noticias.json"
MAX_AGE_DAYS = 30      # idade máxima de uma notícia nova
KEEP_DAYS = 45         # quanto tempo manter no histórico
MAX_ITEMS = 150
PER_QUERY = 25

# (consulta, janela)
QUERIES = [
    '"mercado imobiliário" Goiânia',
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
]

RELEVANT = re.compile(
    r"imobili|imovel|imoveis|apartament|moradia|habitac|construcao|construtora|incorporad|"
    r"lancamento|empreendimento|financiamento|credito|casa propria|minha casa|fgts|selic|"
    r"aluguel|loteamento|condominio|residencial|cyrela|mrv|tenda|direcional|secovi|abrainc|"
    r"cbic|fipezap|creci|itbi|iptu|plano diretor|alto padrao|vgv|sbpe|poupanca"
)
LOCAL_TITLE = re.compile(r"goiania|goias|goiano|aparecida de goiania|anapolis|senador canedo|trindade|goianira|brasilia")
LOCAL_SOURCES = re.compile(r"o popular|jornal opcao|mais goias|diario de goias|goias|sebrae go|sinduscon-go|secovi-go|creci-go")
CATEGORIES = [  # ordem = prioridade
    ("lancamentos", re.compile(r"lanc|empreendimento|incorporadora|novo residencial|vgv|entrega de obra|canteiro")),
    ("financiamento", re.compile(r"financ|credito|juros|selic|fgts|caixa|minha casa|taxa|consorcio|sbpe|poupanca|parcela")),
    ("regras", re.compile(r"\blei\b|decreto|plano diretor|itbi|iptu|regra|norma|reforma tributaria|stj|stf|cartorio|resolucao|mudanc|projeto de lei|tributa|imposto")),
]


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
    if not RELEVANT.search(t):
        return None
    cat = "mercado"
    for name, rx in CATEGORIES:
        if rx.search(t):
            cat = name
            break
    local = bool(LOCAL_TITLE.search(t) or LOCAL_SOURCES.search(s))
    return cat, local


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
                "title": n["title"], "url": n["url"], "source": n["source"],
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
                items.setdefault(key(old["title"]), old)
        except Exception:
            pass
    cutoff = (now - timedelta(days=KEEP_DAYS)).strftime("%Y-%m-%dT%H:%M:%SZ")
    final = sorted((i for i in items.values() if i["date"] >= cutoff), key=lambda i: i["date"], reverse=True)[:MAX_ITEMS]
    OUT.write_text(
        json.dumps({"updated": now.strftime("%Y-%m-%dT%H:%M:%SZ"), "items": final}, ensure_ascii=False, indent=1) + "\n",
        "utf-8",
    )
    print(f"{len(final)} notícias gravadas em {OUT.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
