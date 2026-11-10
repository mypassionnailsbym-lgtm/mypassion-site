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
 'pl': dict(name='Polski', blog='Poradnik', path='/blog/', slug='dlaczego-paznokcie-sa-miekkie', home='Strona główna', book='Umów wizytę', intro='O paznokciach w prosty sposób. Odpowiedzi na pytania o ich kondycję, pielęgnację i stylizację.', desc='Dlaczego paznokcie są miękkie po zdjęciu hybrydy lub żelu? Poznaj budowę płytki, wpływ matowienia, wody i zdejmowania stylizacji oraz zasady pielęgnacji.', alt='Kolaż naturalnych paznokci oraz paznokci z różową stylizacją', category='Naturalna płytka', read='Przeczytaj artykuł', back='Wróć do poradnika', toc='W tym artykule', skip='Przejdź do treści', date='5 listopada 2026', excerpt='Miękkość nie zawsze oznacza uszkodzenie. Wyjaśniam, co zmienia się po zdjęciu produktu i kiedy warto przyjrzeć się paznokciom uważniej.'),
 'fr': dict(name='Français', blog='Conseils', path='/blog/fr/', slug='ongles-mous-apres-depose', home='Accueil', book='Prendre rendez-vous', intro='Les ongles, expliqués simplement. Des réponses à vos questions sur leur état, leur entretien et les différentes techniques de manucure.', desc='Pourquoi les ongles sont-ils mous après la dépose du vernis semi-permanent ou du gel ? Structure de l’ongle, matification, eau, dépose et conseils de soin.', alt='Collage d’ongles naturels et d’ongles avec une pose rose', category='L’ongle naturel', read='Lire l’article', back='Tous les conseils', toc='Dans cet article', skip='Aller au contenu', date='5 novembre 2026', excerpt='Des ongles mous ne sont pas forcément abîmés. Découvrez ce qui change après la dépose et quand il est utile d’y prêter davantage attention.'),
 'en': dict(name='English', blog='Nail care guide', path='/blog/en/', slug='soft-nails-after-gel-removal', home='Home', book='Book an appointment', intro='Nails, explained simply. Answers to your questions about nail condition, care and treatments.', desc='Why are nails soft after gel polish or gel removal? Understand nail layers, buffing, water, removal methods and how to care for your natural nails.', alt='Collage of natural nails and nails with a pink coating', category='Natural nails', read='Read the article', back='Back to the guide', toc='In this article', skip='Skip to content', date='5 November 2026', excerpt='Softness does not always mean damage. Learn what changes when the product is removed and when your nails may need a closer look.'),
 'nl': dict(name='Nederlands', blog='Nageladvies', path='/blog/nl/', slug='zachte-nagels-na-verwijderen-gel', home='Home', book='Maak een afspraak', intro='Duidelijke uitleg over nagels. Antwoorden op vragen over hun conditie, verzorging en nagelbehandelingen.', desc='Waarom zijn nagels zacht na het verwijderen van gellak of gel? Lees over nagellagen, matteren, water, verwijderingsmethoden en de verzorging van je nagels.', alt='Collage van natuurlijke nagels en nagels met een roze nagelproduct', category='Natuurlijke nagels', read='Lees het artikel', back='Terug naar nageladvies', toc='In dit artikel', skip='Ga naar de inhoud', date='5 november 2026', excerpt='Zachte nagels zijn niet altijd beschadigd. Ontdek wat er verandert na het verwijderen van het product en wanneer je nagels extra aandacht nodig hebben.')
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
  elif block.startswith('### '):
   result.append('<h3>'+inline(block[4:])+'</h3>')
  elif block.startswith('- '):
   result.append('<ul>'+''.join('<li>'+inline(line[2:])+'</li>' for line in block.splitlines())+'</ul>')
  else: result.append('<p>'+inline(block)+'</p>')
 return title,'\n'.join(result),headings
def page(lang, article=False):
 d=LANGS[lang]; title,body,headings=render((ROOT/'blog/content'/d.get('content', f'{lang}.md')).read_text())
 path=article_path(lang) if article else d['path']; url=BASE+path
 page_title=title if article else d['blog']; desc=d['desc'] if article else d['intro']
 alternates='\n'.join(f'<link rel="alternate" hreflang="{l}" href="{BASE+(article_path(l) if article else v["path"])}">' for l,v in LANGS.items())
 alternates+=f'\n<link rel="alternate" hreflang="x-default" href="{BASE+(article_path("pl") if article else LANGS["pl"]["path"])}">'
 languages=''.join(f'<a href="{article_path(l) if article else v["path"]}" lang="{l}" hreflang="{l}" aria-label="{v["name"]}"'+(' aria-current="page"' if lang==l else '')+f'>{l.upper()}</a>' for l,v in LANGS.items())
 language_label={'pl':'Wybierz język','fr':'Choisir la langue','en':'Choose language','nl':'Kies een taal'}[lang]
 language_options=''.join(f'<option value="{article_path(l) if article else v["path"]}" data-lang="{l}"'+(' selected' if lang==l else '')+f'>{l.upper()}</option>' for l,v in LANGS.items())
 crumbs=f'<a href="/?lang={lang}">{d["home"]}</a><span aria-hidden="true">/</span>'+(f'<a href="{d["path"]}">{d["blog"]}</a>' if article else f'<span>{d["blog"]}</span>')
 schema={'@context':'https://schema.org','@type':'BlogPosting' if article else 'CollectionPage','headline':page_title,'description':desc,'inLanguage':lang,'url':url,'image':BASE+IMAGE,'publisher':{'@type':'Organization','name':BRAND,'url':BASE}}
 if article:
  if d.get('content','').startswith('hygiene/'):
   extra_photos={"pl":"<figure style=\"max-width:540px;margin:32px auto\"><img class=\"article-photo\" style=\"max-width:540px;margin-bottom:12px\" src=\"/images/blog-pilniki-wymienne.webp\" alt=\"Pilniki i wymienne materiały ścierne w kieszeni dżinsów — zdjęcie aranżowane\" width=\"1254\" height=\"1254\" loading=\"lazy\" decoding=\"async\"><figcaption style=\"font-size:13px;color:var(--muted);text-align:center\">Pilniki i wymienne materiały ścierne — zdjęcie aranżowane.</figcaption></figure>\n","fr":"<figure style=\"max-width:540px;margin:32px auto\"><img class=\"article-photo\" style=\"max-width:540px;margin-bottom:12px\" src=\"/images/blog-pilniki-wymienne.webp\" alt=\"Limes et abrasifs remplaçables dans une poche de jean — photo mise en scène\" width=\"1254\" height=\"1254\" loading=\"lazy\" decoding=\"async\"><figcaption style=\"font-size:13px;color:var(--muted);text-align:center\">Limes et abrasifs remplaçables — photo mise en scène.</figcaption></figure>\n","en":"<figure style=\"max-width:540px;margin:32px auto\"><img class=\"article-photo\" style=\"max-width:540px;margin-bottom:12px\" src=\"/images/blog-pilniki-wymienne.webp\" alt=\"Nail files and replaceable abrasives in a jeans pocket — staged photograph\" width=\"1254\" height=\"1254\" loading=\"lazy\" decoding=\"async\"><figcaption style=\"font-size:13px;color:var(--muted);text-align:center\">Nail files and replaceable abrasives — staged photograph.</figcaption></figure>\n","nl":"<figure style=\"max-width:540px;margin:32px auto\"><img class=\"article-photo\" style=\"max-width:540px;margin-bottom:12px\" src=\"/images/blog-pilniki-wymienne.webp\" alt=\"Nagelvijlen en vervangbare schuurmaterialen in een jeanszak — geënsceneerde foto\" width=\"1254\" height=\"1254\" loading=\"lazy\" decoding=\"async\"><figcaption style=\"font-size:13px;color:var(--muted);text-align:center\">Nagelvijlen en vervangbare schuurmaterialen — geënsceneerde foto.</figcaption></figure>\n"}
   body=body.replace('<h2 id="section-5">',extra_photos[lang]+'<h2 id="section-5">',1)
  for section,photo in d.get('section_photos',{}).items():
   marker=re.search(r'<h2 id="section-'+str(section)+r'">.*?</h2>',body).group(0)
   photo_html=f'<img class="article-photo" style="max-width:{photo[5] if len(photo)>5 else 640}px" src="{photo[0]}" alt="{esc(photo[1])}" width="{photo[2]}" height="{photo[3]}" loading="lazy" decoding="async">'
   if len(photo)>4:
    photo_html=f'<figure style="max-width:{photo[5] if len(photo)>5 else 640}px;margin:32px auto">'+photo_html+f'<figcaption style="font-size:13px;color:var(--muted);text-align:center">{esc(photo[4])}</figcaption></figure>'
   body=body.replace(marker,marker+'\n'+photo_html,1)
  hero='' if d.get('section_photos') else f'<img class="article-photo" style="max-width:{d.get("photo_width",640)}px" src="{IMAGE}" alt="{esc(d["alt"])}" width="{d.get("width",1254)}" height="{d.get("height",1254)}" fetchpriority="high">'
  schema.update({'author':{'@type':'Person','name':'Magdalena','url':BASE+'/#about'},'datePublished':d.get('iso_date','2026-11-05'),'dateModified':d.get('iso_date','2026-11-05'),'mainEntityOfPage':url})
  toc='<details class="toc"><summary>'+d['toc']+'</summary><ol>'+''.join(f'<li><a href="#{i}">{esc(t)}</a></li>' for i,t in headings)+'</ol></details>'
  content=f'''<header class="intro"><p class="eyebrow">{d['category']}</p><h1>{esc(title)}</h1><p class="article-meta">Magdalena · {BRAND} · <time datetime="{d.get('iso_date','2026-11-05')}">{d['date']}</time></p></header>
{hero}
<div class="article-body">{toc}{body}</div><div class="article-end"><a href="{d['path']}">← {d['back']}</a></div>'''
 else:
  content=f'''<header class="intro"><p class="eyebrow">{BRAND} · Halle</p><h1>{d['blog']}</h1><p>{esc(d['intro'])}</p></header>
<article class="article-card"><a href="{article_path(lang)}" tabindex="-1" aria-hidden="true"><img src="{IMAGE}" alt="" width="{d.get('width',1254)}" height="{d.get('height',1254)}" fetchpriority="high"></a><div class="card-copy"><p class="eyebrow">{d['category']}</p><h2><a href="{article_path(lang)}">{esc(title)}</a></h2><p>{esc(d['excerpt'])}</p><a class="read-more" href="{article_path(lang)}">{d['read']} →</a></div></article>'''
 return f'''<!doctype html>
<html lang="{lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(page_title)} | {BRAND}</title><meta name="description" content="{esc(desc)}"><link rel="canonical" href="{url}">{alternates}
<meta name="theme-color" content="#00FF12"><meta property="og:type" content="{'article' if article else 'website'}"><meta property="og:title" content="{esc(page_title)}"><meta property="og:description" content="{esc(desc)}"><meta property="og:url" content="{url}"><meta property="og:site_name" content="{BRAND}"><meta property="og:image" content="{BASE+IMAGE}"><meta property="og:image:alt" content="{esc(d['alt'])}"><meta property="og:locale" content="{dict(pl='pl_PL',fr='fr_BE',en='en_GB',nl='nl_BE')[lang]}"><meta name="twitter:card" content="summary_large_image"><meta name="author" content="Magdalena — {BRAND}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&amp;family=Playfair+Display:wght@500;600&amp;display=swap" rel="stylesheet"><link rel="stylesheet" href="/blog/blog.css?v=20261105-3"><script defer src="/blog/blog.js?v=20261105-2"></script><script type="application/ld+json">{json.dumps(schema,ensure_ascii=False)}</script></head>
<body><a class="skip" href="#content">{d['skip']}</a><header class="site-header"><div class="header-inner"><a class="brand" href="/?lang={lang}"><img src="/images/logo-placeholder.jpg.jpg" alt="" width="64" height="48"><span>{BRAND}</span></a><nav class="site-nav" aria-label="{d['home']}"><a href="/?lang={lang}">{d['home']}</a><a href="{d['path']}" aria-current="page">{d['blog']}</a><a class="book" href="https://my-passion-nails-by-m.reservio.com/">{d['book']}</a></nav><div class="lang-switcher"><select id="language-switcher" aria-label="{language_label}">{language_options}</select><noscript><nav class="languages" aria-label="Language">{languages}</nav></noscript></div></div></header>
<main class="container" id="content"><nav class="breadcrumbs" aria-label="Breadcrumb">{crumbs}</nav>{'<article>' if article else ''}{content}{'</article>' if article else ''}</main><footer class="site-footer">© 2026 {BRAND} · Halle</footer></body></html>'''
for lang,d in LANGS.items():
 for is_article in (False,True):
  dest=ROOT/(article_path(lang) if is_article else d['path']).strip('/')/'index.html'
  dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(page(lang,is_article),encoding='utf-8')
print('Built 4 guide pages and 4 complete articles.')

# Second article: reuse the exact shared page template, styles and language UI.
# Preserve the existing article editions and add the new card to each guide.
GROWTH = {
 'pl': dict(slug='jak-rosnie-naturalny-paznokiec', desc='Jak rośnie naturalny paznokieć? Poznaj rolę macierzy, tempo wzrostu oraz powody, dla których uszkodzona płytka potrzebuje czasu, aby odrosnąć.', alt='Ten sam paznokieć kciuka: po lewej uszkodzona płytka, po prawej paznokieć po odrośnięciu', excerpt='Oliwka i cierpliwość pełnią różne role. Wyjaśniam, gdzie powstaje paznokieć, jak szybko rośnie i dlaczego uszkodzona część musi odrosnąć.'),
 'fr': dict(slug='croissance-ongle-naturel', desc='Comment pousse l’ongle naturel ? Découvrez le rôle de la matrice, la vitesse de croissance et pourquoi un ongle abîmé a besoin de temps pour repousser.', alt='Le même ongle de pouce : plaque abîmée à gauche, ongle après repousse à droite', excerpt='Les soins et le temps jouent des rôles différents. Découvrez où se forme l’ongle, à quelle vitesse il pousse et pourquoi la partie abîmée doit progressivement être remplacée.'),
 'en': dict(slug='how-natural-nails-grow', desc='How do natural nails grow? Learn about the nail matrix, growth rate and why a damaged nail plate needs time to grow out.', alt='The same thumbnail: damaged nail plate on the left and the nail after regrowth on the right', excerpt='Care and time play different roles. Learn where nails form, how quickly they grow and why the damaged part has to grow out.'),
 'nl': dict(slug='hoe-natuurlijke-nagels-groeien', desc='Hoe groeit een natuurlijke nagel? Lees over de nagelmatrix, de groeisnelheid en waarom een beschadigde nagelplaat tijd nodig heeft om uit te groeien.', alt='Dezelfde duimnagel: de beschadigde nagelplaat links en de nagel na uitgroei rechts', excerpt='Verzorging en tijd spelen elk een andere rol. Ontdek waar een nagel ontstaat, hoe snel hij groeit en waarom het beschadigde deel moet uitgroeien.')
}
LANGS = {lang: dict(d, **GROWTH[lang], content=f'growth/{lang}.md', width=1536, height=1024) for lang,d in LANGS.items()}
IMAGE = '/images/blog-wzrost-paznokcia.webp'
for lang,d in LANGS.items():
 dest=ROOT/article_path(lang).strip('/')/'index.html'
 dest.parent.mkdir(parents=True,exist_ok=True)
 dest.write_text(page(lang,True),encoding='utf-8')
 guide=ROOT/d['path'].strip('/')/'index.html'
 card=re.search(r'<article class="article-card">.*?</article>',page(lang),re.S).group(0)
 existing=guide.read_text()
 existing=existing.replace('<article class="article-card">',card+'\n<article class="article-card">',1)
 guide.write_text(existing,encoding='utf-8')

# Keep every language edition discoverable without duplicating sitemap entries.
sitemap=ROOT/'sitemap.xml'
xml=sitemap.read_text()
entries=[]
for lang in LANGS:
 url=BASE+article_path(lang)
 if '<loc>'+url+'</loc>' not in xml:
  entries.append('<url><loc>'+url+'</loc><lastmod>2026-11-05</lastmod></url>')
xml=xml.replace('</urlset>','\n'.join(entries)+'\n</urlset>')
sitemap.write_text(xml,encoding='utf-8')
print('Built 4 growth articles and added their cards to the 4 guides.')

# Third article: single-use files and salon hygiene.
HYGIENE = {
 'pl': dict(slug='dlaczego-jednorazowy-pilnik',category='Higiena manicure',date='6 listopada 2026',desc='Dlaczego jednorazowy pilnik ma znaczenie? Poznaj różnice między czyszczeniem, dezynfekcją i sterylizacją oraz moje zasady przygotowania do manicure.',alt='Zestaw do manicure: zapakowane pilniki, blok polerski i narzędzia w pakietach na tacy',excerpt='Nowy nie zawsze znaczy sterylny. Wyjaśniam, dlaczego pilnik jednorazowy wyrzucam po każdej wizycie i jak przygotowuję narzędzia do pracy.'),
 'fr': dict(slug='lime-a-usage-unique-manucure',category='Hygiène de la manucure',date='6 novembre 2026',desc='Pourquoi utiliser une lime à usage unique ? Découvrez les différences entre nettoyage, désinfection et stérilisation et ma préparation avant une manucure.',alt='Matériel de manucure sur un plateau : limes emballées, bloc polissoir et instruments sous sachets',excerpt='Neuf ne signifie pas toujours stérile. Découvrez pourquoi je jette la lime après chaque rendez-vous et comment je prépare mes instruments.'),
 'en': dict(slug='single-use-nail-file-manicure',category='Manicure hygiene',date='6 November 2026',desc='Why does a single-use nail file matter? Learn the differences between cleaning, disinfection and sterilisation, and how I prepare for each manicure.',alt='Manicure supplies on a tray: wrapped nail files, a buffer block and instruments in pouches',excerpt='New does not always mean sterile. Find out why I discard the file after every appointment and how I prepare my tools.'),
 'nl': dict(slug='wegwerpvijl-bij-manicure',category='Hygiëne bij manicure',date='6 november 2026',desc='Waarom is een wegwerpvijl belangrijk? Lees over reinigen, desinfecteren en steriliseren en hoe ik mijn werkplek en instrumenten voorbereid.',alt='Manicurematerialen op een schaal: verpakte vijlen, een bufferblok en instrumenten in zakjes',excerpt='Nieuw betekent niet altijd steriel. Ontdek waarom ik de vijl na elke afspraak weggooi en hoe ik mijn instrumenten voorbereid.')
}
LANGS = {lang: dict(d, **HYGIENE[lang], content=f'hygiene/{lang}.md', width=1122, height=1402, photo_width=440,iso_date='2026-11-06') for lang,d in LANGS.items()}
IMAGE = '/images/blog-jednorazowy-pilnik.webp'
for lang,d in LANGS.items():
 dest=ROOT/article_path(lang).strip('/')/'index.html'
 dest.parent.mkdir(parents=True,exist_ok=True)
 dest.write_text(page(lang,True),encoding='utf-8')
 guide=ROOT/d['path'].strip('/')/'index.html'
 card=re.search(r'<article class="article-card">.*?</article>',page(lang),re.S).group(0)
 guide.write_text(guide.read_text().replace('<article class="article-card">',card+'\n<article class="article-card">',1),encoding='utf-8')
xml=sitemap.read_text()
for lang in LANGS:
 url=BASE+article_path(lang)
 if '<loc>'+url+'</loc>' not in xml:
  xml=xml.replace('</urlset>','<url><loc>'+url+'</loc><lastmod>2026-11-06</lastmod></url>\n</urlset>')
sitemap.write_text(xml,encoding='utf-8')
print('Built 4 hygiene articles and updated the guides and sitemap.')

# Fourth article: gel polish and hard builder gel, with photos beside each material.
GEL_POLISH = {
 'pl': dict(slug='hybryda-a-zel',category='Hybryda i żel',date='8 listopada 2026',desc='Czym różnią się hybryda i żel? Poznaj właściwości materiałów, czas noszenia, sposoby usuwania i moje podejście do wzmacniania naturalnych paznokci.',alt='Kolekcja lakierów hybrydowych w złotych buteleczkach',gel_alt='Zbliżenie różowego żelu budującego nabieranego ze słoiczka',excerpt='Cienka, elastyczna powłoka czy mocniejsza konstrukcja? Wyjaśniam różnice między hybrydą a żelem i kiedy zaplanować kolejną wizytę.'),
 'fr': dict(slug='semi-permanent-ou-gel',category='Semi-permanent et gel',date='8 novembre 2026',desc='Vernis semi-permanent ou gel : découvrez leurs propriétés, la durée de tenue, la dépose et mon approche du renforcement des ongles naturels.',alt='Collection de vernis semi-permanents dans des flacons dorés',gel_alt='Gros plan sur un gel de construction rose prélevé dans son pot',excerpt='Une couche fine et souple ou une structure plus solide ? Découvrez les différences entre semi-permanent et gel et quand prévoir votre prochain rendez-vous.'),
 'en': dict(slug='gel-polish-or-builder-gel',category='Gel polish and builder gel',date='8 November 2026',desc='Gel polish or builder gel? Learn how the products differ, how long to wear them, how they are removed and my approach to reinforcing natural nails.',alt='A collection of gel polishes in gold bottles',gel_alt='Close-up of pink builder gel being lifted from its pot',excerpt='A thin, flexible coating or a stronger structure? Learn the differences between gel polish and builder gel and when to book your next appointment.'),
 'nl': dict(slug='gellak-of-gel',category='Gellak en gel',date='8 november 2026',desc='Gellak of gel? Ontdek de verschillen in eigenschappen, draagtijd en verwijdering en lees hoe ik natuurlijke nagels verstevig.',alt='Een collectie gellakken in gouden flesjes',gel_alt='Close-up van roze bouwgel die uit een potje wordt genomen',excerpt='Een dunne, flexibele laag of een stevigere opbouw? Ontdek de verschillen tussen gellak en gel en wanneer je de volgende afspraak plant.')
}
LANGS = {lang: dict(d, **GEL_POLISH[lang], content=f'gel-polish/{lang}.md', width=1449, height=1085, photo_width=640,iso_date='2026-11-08') for lang,d in LANGS.items()}
IMAGE = '/images/blog-hybryda-lakiery.webp'
for lang,d in LANGS.items():
 d['section_photos']={1:(IMAGE,d['alt'],1449,1085),3:('/images/blog-zel-budujacy.webp',d['gel_alt'],1448,1086)}
 dest=ROOT/article_path(lang).strip('/')/'index.html'
 dest.parent.mkdir(parents=True,exist_ok=True)
 dest.write_text(page(lang,True),encoding='utf-8')
 guide=ROOT/d['path'].strip('/')/'index.html'
 card=re.search(r'<article class="article-card">.*?</article>',page(lang),re.S).group(0)
 guide.write_text(guide.read_text().replace('<article class="article-card">',card+'\n<article class="article-card">',1),encoding='utf-8')
xml=sitemap.read_text()
for lang in LANGS:
 url=BASE+article_path(lang)
 if '<loc>'+url+'</loc>' not in xml:
  xml=xml.replace('</urlset>','<url><loc>'+url+'</loc><lastmod>2026-11-08</lastmod></url>\n</urlset>')
sitemap.write_text(xml,encoding='utf-8')
print('Built 4 gel polish and builder gel articles and updated the guides and sitemap.')

# Fifth article: lifting, with an accurately captioned removal photograph.
LIFTING = {
 'pl': dict(slug='dlaczego-hybryda-lub-zel-odchodzi',category='Trwałość stylizacji',date='10 listopada 2026',desc='Dlaczego hybryda lub żel odchodzi od paznokcia? Poznaj możliwe przyczyny odspojeń, znaczenie przygotowania i dopasowania materiału oraz zasady postępowania.',alt='Zbliżenie paznokcia podczas usuwania stylizacji, z widocznymi pozostałościami produktu',caption='Paznokieć podczas usuwania stylizacji — widoczne pozostałości produktu.',excerpt='Odspojenie może mieć różne przyczyny. Wyjaśniam, co wpływa na przyczepność produktu i jak postąpić, kiedy materiał zaczyna odchodzić.'),
 'fr': dict(slug='pourquoi-semi-permanent-gel-se-decolle',category='Tenue de la pose',date='10 novembre 2026',desc='Pourquoi le vernis semi-permanent ou le gel se décolle-t-il ? Découvrez les causes possibles, le rôle de la préparation et les gestes à adopter.',alt='Gros plan sur un ongle pendant la dépose, avec des résidus de produit visibles',caption='Ongle pendant la dépose — des résidus de produit sont visibles.',excerpt='Un décollement peut avoir plusieurs causes. Découvrez ce qui influence l’adhérence du produit et comment réagir lorsqu’il commence à se soulever.'),
 'en': dict(slug='why-gel-polish-or-builder-gel-lifts',category='Manicure wear',date='10 November 2026',desc='Why does gel polish or builder gel lift? Learn about possible causes, preparation, product choice and what to do when your coating starts lifting.',alt='Close-up of a nail during product removal, with visible product residue',caption='Nail during removal — remaining product is visible.',excerpt='Lifting can have several causes. Learn what affects product adhesion and what to do when your coating starts to lift.'),
 'nl': dict(slug='waarom-gellak-of-gel-loslaat',category='Houdbaarheid van je manicure',date='10 november 2026',desc='Waarom laat gellak of gel los? Lees over mogelijke oorzaken, de voorbereiding, de materiaalkeuze en wat je kunt doen als je product begint los te laten.',alt='Close-up van een nagel tijdens het verwijderen van de styling, met zichtbare productresten',caption='Nagel tijdens het verwijderen van de styling — met zichtbare productresten.',excerpt='Loslating kan verschillende oorzaken hebben. Ontdek wat de hechting beïnvloedt en wat je kunt doen als het materiaal begint los te laten.')
}
LANGS = {lang: dict(d, **LIFTING[lang], content=f'lifting/{lang}.md', width=1122, height=1402, photo_width=440,iso_date='2026-11-10') for lang,d in LANGS.items()}
IMAGE = '/images/blog-usuwanie-stylizacji.webp'
for lang,d in LANGS.items():
 d['section_photos']={7:(IMAGE,d['alt'],1122,1402,d['caption'],440)}
 dest=ROOT/article_path(lang).strip('/')/'index.html'
 dest.parent.mkdir(parents=True,exist_ok=True)
 dest.write_text(page(lang,True),encoding='utf-8')
 guide=ROOT/d['path'].strip('/')/'index.html'
 card=re.search(r'<article class="article-card">.*?</article>',page(lang),re.S).group(0)
 guide.write_text(guide.read_text().replace('<article class="article-card">',card+'\n<article class="article-card">',1),encoding='utf-8')
xml=sitemap.read_text()
for lang in LANGS:
 url=BASE+article_path(lang)
 if '<loc>'+url+'</loc>' not in xml:
  xml=xml.replace('</urlset>','<url><loc>'+url+'</loc><lastmod>2026-11-10</lastmod></url>\n</urlset>')
sitemap.write_text(xml,encoding='utf-8')
print('Built 4 lifting articles and updated the guides and sitemap.')





