#!/usr/bin/env python3
"""Прод-сборка сайта OTRI (папка O3S.kz).

Что делает:
  1. Снимает с каждой страницы прошлую прод-обвязку (статичный <head> и снимок #ssr).
  2. Рендерит страницы в headless Chromium и сохраняет готовую HTML-разметку (пререндер):
     поисковики и мессенджеры видят контент и мета-теги без JavaScript.
  3. Собирает страницы заново: SEO-<head> (title, description, canonical, Open Graph,
     Twitter, JSON-LD), снимок контента, отложенная загрузка React (локально, vendor/).
  4. Пишет снимки моделей в _prerender/ (отдаются через .htaccess по ?m=...), sitemap.xml.

Запуск (нужны python3 + playwright + chromium):
  python3 _build/build_prod.py .            # собрать прод (из папки O3S.kz)
  python3 _build/build_prod.py . --strip    # вернуть исходный вид страниц для правок в Claude Design
После правок в Claude Design сборку нужно повторить.
Шрифты в fonts/ урезаны до символов сайта (pyftsubset). Если появятся новые буквы/символы —
пересобрать шрифты из @fontsource-variable/onest и /inter.
"""
import json, os, re, sys, time, subprocess, html
from datetime import date

ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else '.')
BASE = 'https://otri.kz/'
CHROME = os.environ.get('CHROME', '/opt/pw-browsers/chromium')
VENDOR = os.path.join(ROOT, 'vendor')

def rd(p): return open(os.path.join(ROOT, p), encoding='utf-8').read()
def wr(p, s):
    full = os.path.join(ROOT, p); os.makedirs(os.path.dirname(full), exist_ok=True)
    open(full, 'w', encoding='utf-8').write(s)

# ---------- данные из o3s-data.js ----------
def load_data():
    js = rd('o3s-data.js')
    tmp = os.path.join(ROOT, '_build', '_data.mjs'); open(tmp, 'w', encoding='utf-8').write(js)
    out = subprocess.check_output(['node', '-e',
        "import(process.argv[1]).then(d=>{const o={};for(const k in d){if(typeof d[k]!=='function')o[k]=d[k]};process.stdout.write(JSON.stringify(o))})",
        tmp])
    os.remove(tmp)
    return json.loads(out)

D = load_data()
fmt = lambda n: f'{n:,}'.replace(',', ' ') + ' ₸'
ster = {m['id']: m for m in D['STERILIZERS']}
recs = {m['id']: m for m in D['RECIRCULATORS']}
ORG_ID = BASE + '#org'

ORG = {"@type": "Organization", "@id": ORG_ID, "name": "OTRI", "legalName": "ТОО «OTRI»", "url": BASE,
       "logo": BASE + "icon-512.png", "email": "info@otri.kz", "telephone": "+7 771 001 07 44", "taxID": D['LEGAL']['bin'],
       "address": {"@type": "PostalAddress", "streetAddress": "пр. Кабанбай батыра, 11, нп 43", "addressLocality": "Астана",
                   "postalCode": "010000", "addressCountry": "KZ"}}

def crumbs(*items):
    return {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": n, "item": BASE + u} for i, (n, u) in enumerate(items)]}

def product(m, url, desc):
    imgs = [BASE + g for g in (m.get('gallery') or ['img/otri/otri-desktop-recirculator.webp'])]
    return {"@type": "Product", "name": m['name'], "sku": m['id'], "image": imgs, "description": desc,
            "brand": {"@type": "Brand", "name": "OTRI"}, "manufacturer": {"@id": ORG_ID},
            "offers": {"@type": "Offer", "url": BASE + url, "price": m['price'], "priceCurrency": "KZT",
                       "itemCondition": "https://schema.org/NewCondition", "seller": {"@id": ORG_ID}}}

# ---------- страницы ----------
# key -> (file, query, url_for_canonical, title, description, og image, jsonld list, ssr model id)
PAGES = {}
def page(key, file, query, url, title, desc, og, ld, model=None):
    PAGES[key] = dict(file=file, query=query, url=url, title=title, desc=desc, og=og, ld=ld, model=model)

faq = {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": f['q'],
        "acceptedAnswer": {"@type": "Answer", "text": f['a']}} for f in D['FAQ']]}
page('index', 'index.html', '', '',
     'Озоновые стерилизаторы и рециркуляторы OTRI — производитель в Казахстане',
     'Низкотемпературная стерилизация за 30–70 мин при до 45 °C. Регистрационное удостоверение РК. Монтаж и обучение включены. Рециркуляторы от 65 000 ₸.',
     'og-home', [ORG, {"@type": "WebSite", "name": "OTRI", "url": BASE, "inLanguage": "ru", "publisher": {"@id": ORG_ID}}, faq])
page('catalog', 'catalog.dc.html', '', 'catalog.dc.html',
     'Каталог OTRI: озоновые стерилизаторы OTRI S и УФ-рециркуляторы OTRI Desktop',
     '5 озоновых стерилизаторов OTRI S от 16 до 250 л и 2 бактерицидных рециркулятора OTRI Desktop от 65 000 ₸. Регистрационное удостоверение РК, поставка под ключ.',
     'og-catalog', [ORG, crumbs(('Главная', ''), ('Каталог', 'catalog.dc.html')),
                    {"@type": "ItemList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": m['name'],
                     "url": BASE + ('o3s-16.dc.html?m=' if m['category'] == 'sterilizer' else 'recirculator.dc.html?m=') + m['id']}
                     for i, m in enumerate(D['STERILIZERS'] + D['RECIRCULATORS'])]}])
page('contacts', 'contacts.dc.html', '', 'contacts.dc.html',
     'Контакты OTRI — Астана, пр. Кабанбай батыра, 11 | +7 771 001 07 44',
     'Телефон и WhatsApp +7 771 001 07 44, info@otri.kz. г. Астана, пр. Кабанбай батыра, 11, нп 43. Реквизиты ТОО «OTRI».',
     'og-contacts', [ORG, {"@type": "LocalBusiness", "@id": BASE + "#place", "name": "OTRI", "image": BASE + "img/og/og-contacts.jpg",
                           "telephone": "+7 771 001 07 44", "email": "info@otri.kz", "url": BASE, "address": ORG['address'], "parentOrganization": {"@id": ORG_ID}},
                     crumbs(('Главная', ''), ('Контакты', 'contacts.dc.html'))])
page('dental', 'dental.dc.html', '', 'dental.dc.html',
     'Озоновый стерилизатор для стоматологии в Астане и Алматы — OTRI S-16',
     'OTRI S-16 для стоматологического кабинета: цикл 30 минут, до 45 °C, прозрачная камера, РУ РК. Комплект «Кабинет под ключ» с рециркулятором OTRI Desktop 30.',
     'og-dental', [ORG, crumbs(('Главная', ''), ('Стоматологиям', 'dental.dc.html'))])
page('rent', 'rent.dc.html', '', 'rent.dc.html',
     'Аренда озонового стерилизатора OTRI для клиники — Астана, Алматы',
     'Аренда стерилизаторов OTRI S-16, S-36, S-40: гарантийный взнос, ежемесячный платёж, сервис включён. Доставка, монтаж и обучение.',
     'og-rent', [ORG, crumbs(('Главная', ''), ('Аренда', 'rent.dc.html'))])
for i, m in enumerate(D['STERILIZERS']):
    url = 'o3s-16.dc.html?m=' + m['id']
    desc = f"{m['name']}: камера {m['chamber']} см, цикл {m['cycle']} мин, до 45 °C, 70 Вт. Цена от {fmt(m['price'])}. Поставка под ключ, гарантия от 37 месяцев."
    page('ster-' + m['id'], 'o3s-16.dc.html', '' if i == 0 else '?m=' + m['id'], url,
         f"Озоновый стерилизатор {m['name']}, {m['vol']} л — цена в Казахстане", desc, 'og-' + m['id'],
         [ORG, product(m, url, m.get('desc') or desc), crumbs(('Главная', ''), ('Каталог', 'catalog.dc.html'), (m['name'], url))], model=m['id'])
for i, m in enumerate(D['RECIRCULATORS']):
    url = 'recirculator.dc.html?m=' + m['id']
    desc = f"Закрытый бактерицидный УФ-рециркулятор {m['name']} для помещений до {m['area']} м², {m['lamps']} лампы. {fmt(m['price'])} без НДС, доставка включена, гарантия 12 месяцев."
    page('rec-' + m['id'], 'recirculator.dc.html', '' if i == 0 else '?m=' + m['id'], url,
         f"Бактерицидный рециркулятор {m['name']} до {m['area']} м² — {fmt(m['price'])}", desc, 'og-' + m['id'],
         [ORG, product(m, url, desc), crumbs(('Главная', ''), ('Каталог', 'catalog.dc.html'), (m['name'], url))], model=m['id'])

# ---------- 1. снять прошлую обвязку ----------
HEAD_SRC = '<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<script src="./support.js"></script>\n</head>'
def strip(s):
    s = re.sub(r'<head>.*?</head>', HEAD_SRC, s, count=1, flags=re.S)
    s = re.sub(r'<!--ssr:start-->.*?<!--ssr:end-->\s*', '', s, flags=re.S)
    s = re.sub(r'<!--boot:start-->.*?<!--boot:end-->\s*', '', s, flags=re.S)
    m = re.search(r'<!--tpl:start--><script type="text/x-dc-template"[^>]*>(.*?)</script>.*?<!--tpl:end-->', s, flags=re.S)
    if m:
        s = s[:m.start()] + '<x-dc>' + m.group(1).replace('<\\/script', '</script') + '</x-dc>' + s[m.end():]
    s = s.replace('<html lang="ru">', '<html>')
    return s

files = sorted({p['file'] for p in PAGES.values()})
for f in files: wr(f, strip(rd(f)))
if '--strip' in sys.argv:
    print('Исходники восстановлены (без прод-обвязки) — можно править в Claude Design.'); sys.exit(0)

# ---------- 2. пререндер ----------
from playwright.sync_api import sync_playwright
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8765', '--bind', '127.0.0.1'], cwd=ROOT,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
snaps = {}
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROME)
        for key, pg_ in PAGES.items():
            ctx = b.new_context(viewport={'width': 1440, 'height': 900})
            pg = ctx.new_page()
            def route(r):
                u = r.request.url
                if 'unpkg.com/react-dom' in u: return r.fulfill(path=f'{VENDOR}/react-dom.production.min.js', content_type='application/javascript')
                if 'unpkg.com/react@' in u: return r.fulfill(path=f'{VENDOR}/react.production.min.js', content_type='application/javascript')
                return r.continue_() if u.startswith('http://127.0.0.1') else r.abort()
            pg.route('**/*', route)
            pg.goto(f"http://127.0.0.1:8765/{pg_['file']}{pg_['query']}", wait_until='networkidle')
            last, stable = -1, 0
            for _ in range(80):
                n = pg.evaluate("(document.getElementById('dc-root')||{innerHTML:''}).innerHTML.length")
                stable = stable + 1 if (n == last and n > 1000) else 0
                last = n
                if stable >= 4: break
                time.sleep(0.25)
            snaps[key] = pg.evaluate("""()=>({html: document.getElementById('dc-root').innerHTML,
                styles: [...document.head.querySelectorAll('style')].map(s=>s.textContent).filter(t=>!/^x-dc\\{display:none/.test(t))})""")
            print('rendered', key, len(snaps[key]['html']))
            ctx.close()
        b.close()
finally:
    srv.terminate()

# ---------- 3. сборка ----------
FONTS = ''.join(
    f"@font-face{{font-family:'{fam}';font-style:normal;font-display:{'block' if fam == 'Onest' else 'swap'};font-weight:100 900;src:url(fonts/{fam.lower()}-{sub}-wght-normal.woff2) format('woff2');unicode-range:{rng}}}"
    for fam in ('Onest', 'Inter') for sub, rng in (
        ('cyrillic-ext', 'U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F'),
        ('cyrillic', 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116'),
        ('latin-ext', 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF'),
        ('latin', 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD')))

SWAP_CSS = ('x-dc{display:none!important}'
            'html:not(.dc-live) #dc-root{position:absolute!important;top:0;left:0;width:100%;height:auto!important;visibility:hidden;pointer-events:none;overflow:hidden;max-height:100vh}'
            'html.dc-live #ssr{display:none}html.ssr-stale #ssr{visibility:hidden}')

SWAP_JS = """(function(){var d=document,h=d.documentElement,ssr=d.getElementById('ssr');if(!ssr)return;
var want=ssr.getAttribute('data-model'),q=null;try{q=new URLSearchParams(location.search).get('m')}catch(e){}
if(want&&q&&q!==want)h.classList.add('ssr-stale');
var need=ssr.textContent.length*0.9,done=0;
function live(){if(done)return;done=1;var y=window.scrollY;h.classList.add('dc-live');h.classList.remove('ssr-stale');ssr.parentNode&&ssr.parentNode.removeChild(ssr);window.scrollTo(0,y);mo.disconnect()}
function check(){var r=d.getElementById('dc-root');if(r&&r.textContent.length>=need)live()}
var t=0,mo=new MutationObserver(function(){if(!t)t=setTimeout(function(){t=0;check()},60)});
mo.observe(d.body,{childList:true,subtree:true,characterData:true});
setTimeout(function(){var r=d.getElementById('dc-root');if(r&&r.textContent.length>need*0.5)live();else h.classList.remove('ssr-stale')},9000);})();"""

def esc(s): return html.escape(s, quote=True)

def build_head(p, styles):
    canon = BASE + p['url']
    og = BASE + 'img/og/' + p['og'] + '.jpg'
    ld = json.dumps({"@context": "https://schema.org", "@graph": p['ld']}, ensure_ascii=False).replace('</', '<\\/')
    seen, css = set(), []
    for s in styles:
        if s not in seen: seen.add(s); css.append(s)
    return f"""<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(p['title'])}</title>
<meta name="description" content="{esc(p['desc'])}">
<link rel="canonical" href="{esc(canon)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#058CC5">
<meta property="og:type" content="{'product' if p['model'] else 'website'}">
<meta property="og:site_name" content="OTRI">
<meta property="og:locale" content="ru_RU">
<meta property="og:url" content="{esc(canon)}">
<meta property="og:title" content="{esc(p['title'])}">
<meta property="og:description" content="{esc(p['desc'])}">
<meta property="og:image" content="{og}">
<meta property="og:image:secure_url" content="{og}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{esc(p['title'])}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(p['title'])}">
<meta name="twitter:description" content="{esc(p['desc'])}">
<meta name="twitter:image" content="{og}">
<link rel="icon" href="favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="favicon-32.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="manifest" href="site.webmanifest">
<link rel="preload" href="fonts/onest-cyrillic-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/inter-cyrillic-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/onest-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<style>{FONTS}{SWAP_CSS}</style>
<style>{''.join(css)}</style>
<script type="application/ld+json">{ld}</script>
</head>"""

def boot_block():
    return """<!--boot:start-->
<script>""" + SWAP_JS + """</script>
<link rel="modulepreload" href="o3s-data.js">
<link rel="preload" href="header.dc.html" as="fetch" crossorigin>
<link rel="preload" href="footer.dc.html" as="fetch" crossorigin>
<link rel="preload" href="lead-form.dc.html" as="fetch" crossorigin>
<script>window.__resources={};</script>
<script src="vendor/react.production.min.js" defer></script>
<script src="vendor/react-dom.production.min.js" defer></script>
<script src="support.js" defer></script>
<!--boot:end-->
"""

def compose(src, p, snap):
    s = re.sub(r'<head>.*?</head>', build_head(p, snap['styles']), src, count=1, flags=re.S)
    s = s.replace('<html>', '<html lang="ru">', 1)
    model = f' data-model="{p["model"]}"' if p['model'] else ''
    ssr = f'<!--ssr:start--><div id="ssr"{model}>{snap["html"]}</div><!--ssr:end-->\n'
    a = s.index('<x-dc>'); z = s.index('</x-dc>')
    tpl = s[a + 6:z].replace('</script', '<\\/script')
    TPL_JS = ("(function(){var t=document.getElementById('dc-tpl'),x=document.createElement('x-dc'),"
              "src=t.textContent.replace(/<\\\\\\/script/gi,'</'+'script');"
              "Object.defineProperty(x,'innerHTML',{configurable:true,get:function(){return src}});"
              "t.parentNode.replaceChild(x,t)})();")
    s = (s[:a] + ssr + '<!--tpl:start--><script type="text/x-dc-template" id="dc-tpl">' + tpl + '</script>'
         + '<script>' + TPL_JS + '</script><!--tpl:end-->' + s[z + 7:])
    s = s.replace('</body>', boot_block() + '</body>', 1)
    return s

sources = {f: rd(f) for f in files}
for key, p in PAGES.items():
    out = compose(sources[p['file']], p, snaps[key])
    if p['query']:
        stem = p['file'].replace('.dc.html', '').replace('.html', '')
        wr(f"_prerender/{stem}--{p['model']}.html", out)
    else:
        wr(p['file'], out)
    print('built', key)

# ---------- 4. sitemap ----------
today = date.today().isoformat()
pri = {'index': '1.0', 'catalog': '0.9', 'dental': '0.9'}
urls = ''.join(f"  <url><loc>{esc(BASE + p['url'])}</loc><lastmod>{today}</lastmod><priority>{pri.get(k, '0.8' if p['model'] else '0.7')}</priority></url>\n"
               for k, p in PAGES.items())
wr('sitemap.xml', f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n')
print('sitemap ok')
