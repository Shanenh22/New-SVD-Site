#!/usr/bin/env python3
"""
build.py — Spring Valley Dental site build & QA (June 2026, v7)

One command keeps the site honest. Run from the site root:

    python3 build.py            # full QA (read-only checks)
    python3 build.py --fix      # QA + regenerate minified CSS/JS + sitemap lastmod + footer sync

Checks (always run):
  1. Internal link & asset integrity (every href/src resolves)
  2. JSON-LD validity (every block parses)
  3. hreflang reciprocity (every pair points back)
  4. Icon sprite coverage (every #i-* reference exists in icons-sprite.svg)
  5. Sitemap parity (indexable pages <-> sitemap entries, both directions)
  6. Spanish parity report (EN pages lacking an ES twin — informational)
  7. og:image dimension truth (declared w/h match the actual file)
  8. Tag balance on div/section/main/article/ul/form
  9. Title length (>60 chars flagged) & single-H1
 10. Banned-claims scan (e.g. wisdom-teeth service claims; see BANNED)
 11. Footer drift report (pages whose <footer> no longer matches
     templates/footer_en.html or templates/footer_es.html — see FOOTER SYNC)

--fix additionally:
  * Re-minifies css/styles.css -> css/styles.min.css (needs `npx cleancss` or falls back to internal minifier)
  * Re-minifies js/*.js -> js/*.min.js IF .min.js files are in use
  * Refreshes sitemap <lastmod> from file mtimes (only moves dates forward)
  * Re-stamps templates/footer_en.html / footer_es.html onto every page
    (see FOOTER SYNC below for what's preserved per page)

FOOTER SYNC
-----------
The footer markup lives in TWO template files, not one:
    templates/footer_en.html   (English pages)
    templates/footer_es.html   (Spanish pages, in es/)

To change the footer: edit ONE of those two files, then run
    python3 build.py --fix
This re-stamps that exact markup into every page. You do not edit
individual page files for footer changes anymore.

Three things are deliberately preserved per-page and NOT overwritten:
  - The footer-about sentence on the 5 city pages (dentist-*-tx.html),
    since each names its own city first for local SEO.
  - aria-current="page" on whichever footer link points at the current
    page (currently only privacy.html / es/index.html use this).
  - The map iframe's aria-label text, since it already varies slightly
    page-to-page for reasons unrelated to footer content and isn't
    something this sync is meant to standardize.

If you add a NEW per-page footer exception in the future, it needs to be
taught to _footer_for_page() below — otherwise --fix will overwrite it.

Exit code 0 = clean, 1 = problems found. Wire into any deploy step.
"""
import re, os, sys, glob, json, subprocess
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)
FIX = '--fix' in sys.argv
ERRORS, WARNINGS = [], []

# Phrases that must never appear as service claims (informational mentions on
# tooth-extractions.html explaining the referral policy are allowlisted).
BANNED = [
    (r'we (?:perform|offer|provide)[^.]*wisdom', 'wisdom-teeth service claim'),
    (r'extracciones[^.]*muelas del juicio(?![^.]*refier)', 'ES wisdom-teeth service claim'),
]

def err(msg):  ERRORS.append(msg)
def warn(msg): WARNINGS.append(msg)

def pages():
    return sorted(glob.glob('*.html') + glob.glob('es/*.html'))

def all_html():
    """Every real HTML page on the site, recursively — but NOT the contents
    of templates/, which holds footer source snippets, not standalone pages,
    and would otherwise fail every link/JSON-LD/tag check that assumes a
    full page (doctype, head, nav, etc.)."""
    return [p for p in glob.glob('**/*.html', recursive=True)
            if not p.startswith('templates' + os.sep) and not p.startswith('templates/')]

def read(p):
    return open(p, encoding='utf-8', errors='replace').read()

# ── footer sync helpers ───────────────────────────────────────────────────
FOOTER_RE = re.compile(r'<footer\b.*?</footer>', re.DOTALL)

def _tpl(name):
    path = os.path.join('templates', name)
    return read(path) if os.path.exists(path) else None

TPL_EN = _tpl('footer_en.html')
TPL_ES = _tpl('footer_es.html')

# city pages keep their own footer-about sentence (city named first, local SEO)
_CITY_ABOUT = {}
for _fn in glob.glob('dentist-*-tx.html'):
    _m = re.search(r'<p class="footer-about">([^<]*)</p>', read(_fn))
    if _m:
        _CITY_ABOUT[_fn] = _m.group(1)

_INLINE_TAGS = {'a', 'span', 'b', 'i', 'strong', 'em'}

def _normalize(s):
    """Collapse whitespace that has no visual effect in rendered HTML, so we
    compare markup the way a browser would, not the way a text diff would.
    Whitespace between two tags, or right after most tags, collapses in HTML
    rendering — EXCEPT right after a closing inline tag (</span>, </a>, etc.)
    where a space can be the only thing separating two visible words."""
    s = re.sub(r'\s+', ' ', s).strip()
    s = re.sub(r'>\s+<', '><', s)
    def _after_tag(m):
        tag = m.group(1)
        name = re.match(r'</([a-zA-Z]+)', tag)
        if name and name.group(1).lower() in _INLINE_TAGS:
            return tag + ' '
        return tag
    s = re.sub(r'(</?[a-zA-Z][^>]*>)\s+(?=\S)', _after_tag, s)
    return s

def _footer_for_page(fname, existing_block, template):
    """Build the footer that SHOULD be on this page: template content, with
    known per-page exceptions carried over from what's there now."""
    out = template
    base = os.path.basename(fname)
    if base in _CITY_ABOUT:
        out = re.sub(r'(<p class="footer-about">)[^<]*(</p>)',
                      r'\1' + _CITY_ABOUT[base] + r'\2', out)
    cur = re.search(r'<a href="([^"]+)"\s+aria-current="page">', existing_block)
    if cur:
        href = cur.group(1)
        out = out.replace(f'<a href="{href}">', f'<a href="{href}" aria-current="page">', 1)
    existing_label = re.search(r'(aria-label="(?:Map showing|Mapa de)[^"]*")', existing_block)
    tpl_label = re.search(r'(aria-label="(?:Map showing|Mapa de)[^"]*")', out)
    if existing_label and tpl_label:
        out = out[:tpl_label.start(1)] + existing_label.group(1) + out[tpl_label.end(1):]
    return out

def check_footer_drift():
    """Report-only: which pages' rendered footer no longer matches the
    template (real content drift), vs. just being reformatted source code."""
    if TPL_EN is None or TPL_ES is None:
        warn('FOOTER SYNC: templates/footer_en.html or footer_es.html missing — skipping footer check')
        return
    for p in pages():
        h = read(p)
        m = FOOTER_RE.search(h)
        if not m:
            continue
        tpl = TPL_ES if p.startswith('es/') else TPL_EN
        wanted = _footer_for_page(p, m.group(0), tpl)
        if _normalize(m.group(0)) != _normalize(wanted):
            err(f'FOOTER DRIFT  {p} differs from template (run --fix to re-sync)')

def sync_footer():
    """--fix action: re-stamp the template footer onto every page, preserving
    the known per-page exceptions. Only writes a file when the footer is
    actually different in a way that would render differently — reformatted-
    but-equivalent markup is left alone so --fix doesn't touch files that
    don't need it. Returns count of files actually changed."""
    changed = 0
    for p in pages():
        h = read(p)
        m = FOOTER_RE.search(h)
        if not m:
            continue
        tpl = TPL_ES if p.startswith('es/') else TPL_EN
        wanted = _footer_for_page(p, m.group(0), tpl)
        if _normalize(m.group(0)) == _normalize(wanted):
            continue
        new_h = h[:m.start()] + wanted + h[m.end():]
        open(p, 'w', encoding='utf-8').write(new_h)
        changed += 1
    return changed

# ── chrome (header nav + mobile drawer) sync ─────────────────────────────
# Same contract as FOOTER SYNC: the chrome markup lives in
#   templates/chrome_en.html / templates/chrome_es.html
# Edit ONE of those, then `python3 build.py --fix`. Never edit nav/drawer
# markup on individual pages.
#
# One per-page value is preserved: the language-switch target (desktop
# .lang-toggle and drawer .drawer-lang-row both point at the page's own
# translation twin). The template holds {{LANG_TARGET}}; the stamp fills it
# from whatever the page currently uses, falling back to the other
# language's homepage. aria-current is deliberately ABSENT from the
# template — js/core.js sets it at runtime so templates stay byte-identical
# across pages.
CHROME_RE = re.compile(r'<nav class="site-nav".*?(?=<main[\s>])', re.DOTALL)

TPL_CH_EN = _tpl('chrome_en.html')
TPL_CH_ES = _tpl('chrome_es.html')

def _chrome_for_page(fname, page_html, existing_block, template):
    # 1st choice: the page's own hreflang twin (always present on indexable pages)
    other = 'en' if fname.startswith('es/') else 'es'
    m = re.search(r'hreflang="%s" href="https://springvalleydentistry\.com/([^"]*)"' % other,
                  page_html)
    if m:
        path = m.group(1) or 'index.html'
        target = ('../' + path) if fname.startswith('es/') else path
    else:
        # 2nd choice: whatever the page used before; last resort: other homepage
        m2 = re.search(r'<a href="([^"]+)"[^>]*class="(?:lang-toggle|drawer-lang-row)"',
                       existing_block)
        if m2:
            target = m2.group(1)
        else:
            target = '../index.html' if fname.startswith('es/') else 'es/index.html'
    return template.replace('{{LANG_TARGET}}', target)

def check_chrome_drift():
    if TPL_CH_EN is None or TPL_CH_ES is None:
        warn('CHROME SYNC: templates/chrome_en.html or chrome_es.html missing — skipping chrome check')
        return
    for p in pages():
        h = read(p)
        m = CHROME_RE.search(h)
        if not m:
            continue
        tpl = TPL_CH_ES if p.startswith('es/') else TPL_CH_EN
        wanted = _chrome_for_page(p, h, m.group(0), tpl)
        got = re.sub(r'\s*aria-current="page"', '', m.group(0))
        if _normalize(got) != _normalize(wanted):
            err(f'CHROME DRIFT  {p} nav/drawer differs from template (run --fix to re-sync)')

def sync_chrome():
    changed = 0
    if TPL_CH_EN is None or TPL_CH_ES is None:
        return changed
    for p in pages():
        h = read(p)
        m = CHROME_RE.search(h)
        if not m:
            continue
        tpl = TPL_CH_ES if p.startswith('es/') else TPL_CH_EN
        wanted = _chrome_for_page(p, h, m.group(0), tpl)
        got = re.sub(r'\s*aria-current="page"', '', m.group(0))
        if _normalize(got) == _normalize(wanted):
            continue
        new_h = h[:m.start()] + wanted + h[m.end():]
        open(p, 'w', encoding='utf-8').write(new_h)
        changed += 1
    return changed

# 1 ── links
for p in all_html():
    h = read(p); base = os.path.dirname(p)
    for m in re.finditer(r'(?:href|src)="([^"]+)"', h):
        u = m.group(1).split('#')[0].split('?')[0].strip()
        if not u or u.startswith(('http', 'mailto:', 'tel:', 'sms:', 'data:', '//', "'", 'javascript:')):
            continue
        t = u.lstrip('/') if u.startswith('/') else os.path.normpath(os.path.join(base, u))
        if t in ('', '.'): t = 'index.html'
        if not os.path.exists(t):
            err(f'BROKEN LINK  {p} -> {u}')

# 2 ── JSON-LD
for p in all_html():
    for blk in re.findall(r'<script type="application/ld\+json">(.*?)</script>', read(p), re.S):
        try:
            json.loads(blk)
        except Exception as e:
            err(f'BAD JSON-LD  {p}: {str(e)[:60]}')

# 3 ── hreflang reciprocity
for p in pages():
    h = read(p)
    for lang, target in re.findall(
            r'<link rel="alternate" hreflang="(\w+(?:-\w+)?)" href="https://springvalleydentistry\.com/([^"]*)"/>', h):
        if lang == 'x-default':
            continue
        tfile = target or 'index.html'
        if not os.path.exists(tfile):
            err(f'HREFLANG TARGET MISSING  {p} -> {target}')
            continue
        if tfile == p:
            continue
        back = f'href="https://springvalleydentistry.com/{"" if p == "index.html" else p}"'
        th = read(tfile)
        if 'rel="alternate"' in th and back not in th:
            err(f'HREFLANG NOT RECIPROCAL  {p} <-> {tfile}')

# 4 ── sprite coverage
sprite_ids = set(re.findall(r'id="(i-[a-z0-9-]+)"', read('images/icons-sprite.svg')))
referenced = set()
for p in all_html() + glob.glob('js/*.js'):
    for ref in re.findall(r'icons-sprite\.svg#(i-[a-z0-9-]+)', read(p)):
        if ref.endswith('-'):   # dynamic JS concatenation, e.g. 'i-player-' + state
            continue
        referenced.add(ref)
        if ref not in sprite_ids:
            err(f'MISSING SPRITE SYMBOL  {p} -> #{ref}')
# dynamic refs built in JS (player-play/pause) — keep them referenced
referenced |= {'i-player-play', 'i-player-pause'}
unused = sprite_ids - referenced
if unused:
    warn(f'sprite symbols defined but unreferenced ({len(unused)}): {sorted(unused)[:8]}…')

# 5 ── sitemap parity
locs = set(re.findall(r'<loc>https://springvalleydentistry\.com/?([^<]*)</loc>', read('sitemap.xml')))
idx = {('' if p == 'index.html' else p) for p in pages() if 'noindex' not in read(p)}
for x in sorted(locs - idx): err(f'SITEMAP ORPHAN (no indexable file)  {x or "/"}')
for x in sorted(idx - locs): err(f'NOT IN SITEMAP  {x or "/"}')
try:
    ET.fromstring(read('sitemap.xml'))
except Exception as e:
    err(f'SITEMAP INVALID XML: {e}')

# 6 ── Spanish parity (informational)
es_twins = set()
for p in pages():
    m = re.search(r'hreflang="es" href="https://springvalleydentistry\.com/(es/[^"]*)"', read(p))
    if m: es_twins.add(p)
en_unpaired = [p for p in pages()
               if not p.startswith('es/') and 'noindex' not in read(p) and p not in es_twins]
if en_unpaired:
    warn(f'EN pages without ES twin ({len(en_unpaired)}): {en_unpaired}')

# 7 ── og dimension truth
try:
    from PIL import Image
    for p in all_html():
        h = read(p)
        m = re.search(r'property="og:image" content="https://springvalleydentistry\.com/(images/[^"]*)"', h)
        if not m: continue
        img = m.group(1)
        if not os.path.exists(img):
            err(f'OG IMAGE MISSING  {p} -> {img}'); continue
        w = re.search(r'og:image:width" content="(\d+)"', h)
        ht = re.search(r'og:image:height" content="(\d+)"', h)
        if w and ht:
            real = Image.open(img).size
            if real != (int(w.group(1)), int(ht.group(1))):
                err(f'OG DIMS WRONG  {p}: declared {w.group(1)}x{ht.group(1)}, real {real[0]}x{real[1]}')
except ImportError:
    warn('Pillow not installed — og dimension check skipped (pip install pillow)')

# 8 ── tag balance
for p in pages():
    h = re.sub(r'<script.*?</script>', '', read(p), flags=re.S)
    h = re.sub(r'<!--.*?-->', '', h, flags=re.S)
    for tag in ['div', 'section', 'main', 'article', 'ul', 'form', 'nav', 'footer']:
        o = len(re.findall(rf'<{tag}[\s>]', h)); c = len(re.findall(rf'</{tag}>', h))
        if o != c:
            err(f'TAG IMBALANCE  {p}: <{tag}> open={o} close={c}')

# 9 ── titles / H1
import html as H
for p in pages():
    h = read(p)
    if 'noindex' in h: continue
    t = re.search(r'<title>(.*?)</title>', h, re.S)
    if t and len(H.unescape(t.group(1))) > 60:
        warn(f'TITLE >60 chars  {p} ({len(H.unescape(t.group(1)))})')
    n = len(re.findall(r'<h1[\s>]', h))
    if n != 1:
        err(f'H1 COUNT {n}  {p}')

# 10 ── banned claims
for p in pages():
    h = read(p)
    for pat, label in BANNED:
        if re.search(pat, h, re.I):
            err(f'BANNED CLAIM ({label})  {p}')

# 11 ── footer drift (does any page's footer no longer match the template?)
check_footer_drift()
check_chrome_drift()

# ── --fix actions ────────────────────────────────────────────────────────────
if FIX:
    # CSS minify
    try:
        subprocess.run(['npx', 'cleancss', '-o', 'css/styles.min.css', 'css/styles.css'],
                       check=True, capture_output=True)
        print('minified css/styles.min.css')
    except Exception:
        css = read('css/styles.css')
        css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
        css = re.sub(r'\s+', ' ', css)
        css = re.sub(r'\s*([{}:;,>])\s*', r'\1', css).replace(';}', '}')
        open('css/styles.min.css', 'w', encoding='utf-8').write(css)
        print('minified css (internal fallback)')
    # JS minify only if min files are referenced
    if any('.min.js' in read(p) for p in ['index.html']):
        for f in glob.glob('js/*.js'):
            if f.endswith('.min.js'): continue
            try:
                subprocess.run(['npx', 'terser', f, '-c', '-m', '-o', f.replace('.js', '.min.js')],
                               check=True, capture_output=True)
            except Exception as e:
                warn(f'terser failed for {f}: install with `npm i -g terser`')
        print('minified js/*.min.js')
    # sitemap lastmod from mtimes (forward only)
    import datetime
    s = read('sitemap.xml')
    def bump(m):
        loc, lm = m.group(1), m.group(2)
        f = loc or 'index.html'
        if not os.path.exists(f): return m.group(0)
        fd = datetime.date.fromtimestamp(os.path.getmtime(f)).isoformat()
        return m.group(0).replace(lm, max(lm, fd))
    s = re.sub(r'<loc>https://springvalleydentistry\.com/?([^<]*)</loc>\s*<lastmod>([^<]+)</lastmod>',
               bump, s)
    open('sitemap.xml', 'w', encoding='utf-8').write(s)
    print('sitemap lastmod refreshed')
    # footer sync: re-stamp templates/footer_en.html & footer_es.html
    n = sync_footer()
    print(f'footer sync: {n} file(s) updated to match templates/')
    n = sync_chrome()
    print(f'chrome sync: {n} file(s) updated to match templates/')

# ── report ───────────────────────────────────────────────────────────────────
print(f'\n{"="*60}\nbuild.py QA — {len(ERRORS)} errors, {len(WARNINGS)} warnings')
for e in ERRORS:   print('  ERROR ', e)
for w in WARNINGS: print('  warn  ', w)
sys.exit(1 if ERRORS else 0)
