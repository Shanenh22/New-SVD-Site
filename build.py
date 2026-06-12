#!/usr/bin/env python3
"""
build.py — Spring Valley Dental site build & QA (June 2026, v6)

One command keeps the site honest. Run from the site root:

    python3 build.py            # full QA (read-only checks)
    python3 build.py --fix      # QA + regenerate minified CSS/JS + sitemap lastmod

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

--fix additionally:
  * Re-minifies css/styles.css -> css/styles.min.css (needs `npx cleancss` or falls back to internal minifier)
  * Re-minifies js/*.js -> js/*.min.js IF .min.js files are in use
  * Refreshes sitemap <lastmod> from file mtimes (only moves dates forward)

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

def read(p):
    return open(p, encoding='utf-8', errors='replace').read()

# 1 ── links
for p in glob.glob('**/*.html', recursive=True):
    h = read(p); base = os.path.dirname(p)
    for m in re.finditer(r'(?:href|src)="([^"]+)"', h):
        u = m.group(1).split('#')[0].split('?')[0].strip()
        if not u or u.startswith(('http', 'mailto:', 'tel:', 'data:', '//', "'", 'javascript:')):
            continue
        t = u.lstrip('/') if u.startswith('/') else os.path.normpath(os.path.join(base, u))
        if t in ('', '.'): t = 'index.html'
        if not os.path.exists(t):
            err(f'BROKEN LINK  {p} -> {u}')

# 2 ── JSON-LD
for p in glob.glob('**/*.html', recursive=True):
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
for p in glob.glob('**/*.html', recursive=True) + glob.glob('js/*.js'):
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
    for p in glob.glob('**/*.html', recursive=True):
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

# ── report ───────────────────────────────────────────────────────────────────
print(f'\n{"="*60}\nbuild.py QA — {len(ERRORS)} errors, {len(WARNINGS)} warnings')
for e in ERRORS:   print('  ERROR ', e)
for w in WARNINGS: print('  warn  ', w)
sys.exit(1 if ERRORS else 0)
