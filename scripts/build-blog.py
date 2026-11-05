"""Build the four static blog editions. Run from any directory with Python 3.
Source articles use headings, paragraphs, lists, bold text and Markdown links.
"""
from pathlib import Path
import html
import json
import re

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://mypassionnailsbym.com'
IMAGE = '/images/blog-miekkie-paznokcie.webp'
BRAND = 'My Passion Nails by M'
LANGS = {
 'pl': dict(name='Polski', blog='Poradnik', path='/blog/', slug='dlaczego-paznokcie-sa-miekkie', home='Strona główna', book='Umów wizytę', intro='O paznokciach w prosty sposób. Odpowiedzi na pytania, które pojawiają się przed wizytą i po stylizacji.', desc='Dlaczego paznokcie są miękkie po zdjęciu hybrydy lub żelu? Poznaj budowę płytki, wpływ matowienia, wody i zdejmowania stylizacji oraz zasady pielęgnacji.', alt='Kolaż naturalnych paznokci oraz paznokci z różową stylizacją', category='Naturalna płytka', read='Przeczytaj artykuł', back='Wróć do poradnika', toc='W tym artykule', skip='Przejdź do treści', date='5 listopada 2026', excerpt='Miękkość nie zawsze oznacza uszkodzenie. Wyjaśniam, co zmienia się po zdjęciu produktu i kiedy warto przyjrzeć się paznokciom uważniej.'),
 'fr': dict(name='Français', blog='Conseils', path='/blog/fr/', slug='ongles-mous-apres-depose', home='Accueil', book='Prendre rendez-vous', intro='Les ongles, expliqués simplement. Des réponses aux questions que vous vous posez avant un rendez-vous ou après une pose.', desc='Pourquoi les ongles sont-ils mous après la dépose du vernis semi-permanent ou du gel ? Structure de l’ongle, matification, eau, dépose et conseils de soin.', alt='Collage d’ongles naturels et d’ongles avec une pose rose', category='L’ongle naturel', read='Lire l’article', back='Tous les conseils', toc='Dans cet article', skip='Aller au contenu', date='5 novembre 2026', excerpt='Des ongles mous ne sont pas forcément abîmés. Découvrez ce qui change après la dépose et quand il est utile d’y prêter davantage attention.'),
 'en': dict(name='English', blog='Nail care guide', path='/blog/en/', slug='soft-nails-after-gel-removal', home='Home', book='Book an appointment', intro='Nails, explained simply. Answers to the questions you may have before an appointment or after a nail treatment.', desc='Why are nails soft after gel polish or gel removal? Understand nail layers, buffing, water, removal methods and how to care for your natural nails.', alt='Collage of natural nails and nails with a pink coating', category='Natural nails', read='Read the article', back='Back to the guide', toc='In this article', skip='Skip to content', date='5 November 2026', excerpt='Softness does not always mean damage. Learn what changes when the product is removed and when your nails may need a closer look.'),
 'nl': dict(name='Nederlands', blog='Nageladvies', path='/blog/nl/', slug='zachte-nagels-na-verwijderen-gel', home='Home', book='Maak een afspraak', intro='Duidelijke uitleg over nagels. Antwoorden op vragen die je vóór een afspraak of na een nagelbehandeling kunt hebben.', desc='Waarom zijn nagels zacht na het verwijderen van gellak of gel? Lees over nagellagen, matteren, water, verwijderingsmethoden en de verzorging van je nagels.', alt='Collage van natuurlijke nagels en nagels met een roze nagelproduct', category='Natuurlijke nagels', read='Lees het artikel', back='Terug naar nageladvies', toc='In dit artikel', skip='Ga naar de inhoud', date='5 november 2026', excerpt='Zachte nagels zijn niet altijd beschadigd. Ontdek wat er verandert na het verwijderen van het product en wanneer je nagels extra aandacht nodig hebben.')
}
def esc(s): return html.escape(s, quote=True)
def article_path(lang):
 d=LANGS[lang]
 return d['path']+d['slug']+'/'
def inline(s):
 s=esc(s)
 s=re.sub(r'\[([^\]]+)\]\((https://[^ )]+)\)', r'<a href="\2" target="_blank" rel="noopener noreferrer">\1</a>',s)
 return re.sub(r'\*\*(.*?)\*\*',r'<strong>\1</strong>',s)
def render(md):
 title=md.splitlines()[0][2:]
 blocks=md.strip().split('\n\n')[1:]
 result=[]; headings=[]
 for block in blocks:
  if block.startswith('## '):
   title2=block[3:]; ident='section-'+str(len(headings)+1)
   headings.append((ident,title2));result.append(f'<h2 id="{ident}">{inline(title2)}</h2>')
  elif block.startswith('- '):
   result.append('<ul>'+''.join('<li>'+inline(line[2:])+'</li>' for line in block.splitlines())+'</ul>')
  else: result.append('<p>'+inline(block)+'</p>')
 return title,'\n'.join(result),headings
def page(lang, article=False):
 d=LANGS[lang]; title,body,headings=render((ROOT/'blog/content'/f'{lang}.md').read_text())
 path=article_path(lang) if article else d['path']; url=BASE+path
 page_title=title if article else d['blog']; desc=d['desc'] if article else d['intro']
 alternates='\n'.join(f'<link rel="alternate" hreflang="{l}" href="{BASE+(article_path(l) if article else v["path"])}">' for l,v in LANGS.items())
 alternates+=f'\n<link rel="alternate" hreflang="x-default" href="{BASE+(article_path("pl") if article else LANGS["pl"]["path"])}">'
 languages=''.join(f'<a href="{article_path(l) if article else v["path"]}" lang="{l}" hreflang="{l}" aria-label="{v["name"]}"'+(' aria-current="page"' if lang==l else '')+f'>{l.upper()}</a>' for l,v in LANGS.items())
 crumbs=f'<a href="/?lang={lang}">{d["home"]}</a><span aria-hidden="true">/</span>'+(f'<a href="{d["path"]}">{d["blog"]}</a>' if article else f'<span>{d["blog"]}</span>')
 schema={'@context':'https://schema.org','@type':'BlogPosting' if article else 'CollectionPage','headline':page_title,'description':desc,'inLanguage':lang,'url':url,'image':BASE+IMAGE,'publisher':{'@type':'Organization','name':BRAND,'url':BASE}}
 if article:
  schema.update({'author':{'@type':'Person','name':'Magdalena','url':BASE+'/#about'},'datePublished':'2026-11-05','dateModified':'2026-11-05','mainEntityOfPage':url})
  toc='<details class="toc"><summary>'+d['toc']+'</summary><ol>'+''.join(f'<li><a href="#{i}">{esc(t)}</a></li>' for i,t in headings)+'</ol></details>'
  content=f'''<header class="intro"><p class="eyebrow">{d['category']}</p><h1>{esc(title)}</h1><p class="article-meta">Magdalena · {BRAND} · <time datetime="2026-11-05">{d['date']}</time></p></header>
<img class="article-photo" src="{IMAGE}" alt="{esc(d['alt'])}" width="1254" height="1254" fetchpriority="high">
<div class="article-body">{toc}{body}</div><div class="article-end"><a href="{d['path']}">← {d['back']}</a></div>'''
 else:
  content=f'''<header class="intro"><p class="eyebrow">{BRAND} · Halle</p><h1>{d['blog']}</h1><p>{esc(d['intro'])}</p></header>
<article class="article-card"><a href="{article_path(lang)}" tabindex="-1" aria-hidden="true"><img src="{IMAGE}" alt="" width="1254" height="1254" fetchpriority="high"></a><div class="card-copy"><p class="eyebrow">{d['category']}</p><h2><a href="{article_path(lang)}">{esc(title)}</a></h2><p>{esc(d['excerpt'])}</p><a class="read-more" href="{article_path(lang)}">{d['read']} →</a></div></article>'''
 return f'''<!doctype html>
<html lang="{lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(page_title)} | {BRAND}</title><meta name="description" content="{esc(desc)}"><link rel="canonical" href="{url}">{alternates}
<meta name="theme-color" content="#00FF12"><meta property="og:type" content="{'article' if article else 'website'}"><meta property="og:title" content="{esc(page_title)}"><meta property="og:description" content="{esc(desc)}"><meta property="og:url" content="{url}"><meta property="og:site_name" content="{BRAND}"><meta property="og:image" content="{BASE+IMAGE}"><meta property="og:image:alt" content="{esc(d['alt'])}"><meta property="og:locale" content="{dict(pl='pl_PL',fr='fr_BE',en='en_GB',nl='nl_BE')[lang]}"><meta name="twitter:card" content="summary_large_image"><meta name="author" content="Magdalena — {BRAND}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&amp;family=Playfair+Display:wght@500;600&amp;display=swap" rel="stylesheet"><link rel="stylesheet" href="/blog/blog.css"><script defer src="/blog/blog.js"></script><script type="application/ld+json">{json.dumps(schema,ensure_ascii=False)}</script></head>
<body><a class="skip" href="#content">{d['skip']}</a><header class="site-header"><div class="header-inner"><a class="brand" href="/?lang={lang}"><img src="/images/logo-placeholder.jpg.jpg" alt="" width="64" height="48"><span>{BRAND}</span></a><nav class="site-nav" aria-label="{d['home']}"><a href="/?lang={lang}">{d['home']}</a><a href="{d['path']}" aria-current="page">{d['blog']}</a><a class="book" href="https://my-passion-nails-by-m.reservio.com/">{d['book']}</a></nav><nav class="languages" aria-label="Language">{languages}</nav></div></header>
<main class="container" id="content"><nav class="breadcrumbs" aria-label="Breadcrumb">{crumbs}</nav>{'<article>' if article else ''}{content}{'</article>' if article else ''}</main><footer class="site-footer">© 2026 {BRAND} · Halle</footer></body></html>'''
for lang,d in LANGS.items():
 for is_article in (False,True):
  dest=ROOT/(article_path(lang) if is_article else d['path']).strip('/')/'index.html'
  dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(page(lang,is_article),encoding='utf-8')
print('Built 4 guide pages and 4 complete articles.')
