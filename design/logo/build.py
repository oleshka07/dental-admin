"""
Draws the GalaClinic logo as SVG and rasterises it with headless Chromium.

Vector source rather than a generated bitmap: the wordmark has to be spelled and
kerned exactly, the Czech diacritic in ZUBNÍ has to survive, and the same
artwork has to stay crisp at 96 px in the site header and at 1600 px in a print
mock-up. Rendering through a browser is what guarantees the embedded Montserrat
is the font that actually lands in the PNG.

Two assets come out of one drawing:
  logo.png       full lockup — symbol + wordmark, for the website header
  logo-mark.png  symbol only, square — for the Telegram Mini App, whose header
                 already prints the clinic name next to the image
Both have transparent backgrounds so they sit on light and dark surfaces alike.
"""

import base64
import json
import pathlib
import shutil
import subprocess
import tarfile
import tempfile

HERE = pathlib.Path(__file__).parent
REPO = HERE.parent.parent
WORK = HERE / '.work'          # git-ignored: fonts, intermediate HTML, node_modules

FONT_PKG = '@fontsource/montserrat@5'
# latin covers Í; latin-ext is there so a future tagline with ě/č/ř/š/ž/ů
# does not silently fall back to a different face mid-word.
FONT_FILES = [
    ('montserrat-latin-700-normal.woff2', 700),
    ('montserrat-latin-ext-700-normal.woff2', 700),
    ('montserrat-latin-500-normal.woff2', 500),
    ('montserrat-latin-ext-500-normal.woff2', 500),
]


def fonts() -> list[tuple[int, str]]:
    """
    Montserrat, base64'd, fetched from npm rather than committed.

    The wordmark is set in a real geometric sans; the alternative was a
    system font, which differs between machines and would silently change the
    logo. Vendoring ~130 KB of base64 into the repo to achieve that is worse
    than one npm call.
    """
    cache = WORK / 'fonts'
    if not cache.exists():
        cache.mkdir(parents=True)
        with tempfile.TemporaryDirectory() as tmp:
            subprocess.run(['npm', 'pack', FONT_PKG], cwd=tmp, check=True,
                           stdout=subprocess.DEVNULL)
            tgz = next(pathlib.Path(tmp).glob('*.tgz'))
            with tarfile.open(tgz) as tar:
                for name, _ in FONT_FILES:
                    src = tar.extractfile(f'package/files/{name}')
                    assert src is not None, name
                    (cache / name).write_bytes(src.read())

    return [(weight, base64.b64encode((cache / name).read_bytes()).decode())
            for name, weight in FONT_FILES]


FONTS = fonts()

NAVY = '#14528C'
NAVY_DEEP = '#0E3E6E'
MID_BLUE = '#4A7FB5'

# ---------------------------------------------------------------------------
# Symbol geometry. Everything is expressed around a tooth 220 wide and 260 tall
# whose top-left corner sits at (TX, TY), so the ring and sparkles can be placed
# relative to it instead of by trial and error.
# ---------------------------------------------------------------------------

TOOTH = (
    # A molar rather than an incisor: wide crown with a shallow cusp dip along
    # the top, waisting in at the neck, then two roots split by a deep notch.
    'M 4 104 '
    'C 6 46, 44 4, 78 8 '
    'C 94 10, 100 26, 110 26 '
    'C 120 26, 126 10, 142 8 '
    'C 176 4, 214 46, 216 104 '
    'C 218 150, 204 178, 192 208 '
    'C 182 236, 178 262, 168 262 '
    'C 158 262, 154 240, 148 212 '
    'C 140 176, 128 162, 110 162 '
    'C 92 162, 80 176, 72 212 '
    'C 66 240, 62 262, 52 262 '
    'C 42 262, 38 236, 28 208 '
    'C 16 178, 2 150, 4 104 Z'
)

# A soft highlight on the upper left, the way a glazed surface catches light.
TOOTH_GLOSS = (
    'M 60 46 '
    'C 42 64, 32 88, 34 112 '
    'C 36 130, 46 136, 54 126 '
    'C 62 116, 60 96, 72 78 '
    'C 82 62, 78 42, 60 46 Z'
)


def sparkle(cx: float, cy: float, s: float) -> str:
    """A four-pointed star with concave sides — the classic 'sparkle' glyph."""
    k = 0.16 * s
    m = 0.34 * s
    return (
        f'M {cx} {cy - s} '
        f'C {cx + k} {cy - m}, {cx + m} {cy - k}, {cx + s} {cy} '
        f'C {cx + m} {cy + k}, {cx + k} {cy + m}, {cx} {cy + s} '
        f'C {cx - k} {cy + m}, {cx - m} {cy + k}, {cx - s} {cy} '
        f'C {cx - m} {cy - k}, {cx - k} {cy - m}, {cx} {cy - s} Z'
    )


def defs() -> str:
    return f'''
  <defs>
    <linearGradient id="tooth" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#7CC6F0"/>
      <stop offset="42%"  stop-color="#2A79C0"/>
      <stop offset="100%" stop-color="{NAVY_DEEP}"/>
    </linearGradient>
    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#F2F8FC"/>
      <stop offset="35%"  stop-color="#A8C9E2"/>
      <stop offset="62%"  stop-color="#E4F0F8"/>
      <stop offset="100%" stop-color="#8FB5D2"/>
    </linearGradient>
    <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#BFE2F7"/>
      <stop offset="100%" stop-color="#6FAFDB"/>
    </linearGradient>
  </defs>'''


def symbol(cx: float, cy: float, scale: float) -> str:
    """
    The tooth-in-orbit mark, centred on (cx, cy).

    Drawn in three layers so the ring reads as an orbit rather than a flat
    outline: the back half of the ellipse, then the tooth, then the front arc
    painted over the tooth again.
    """
    rx, ry = 210.0, 68.0
    tilt = -18

    # Where the ellipse's horizontal extremes land once tilted — the endpoints
    # of the half that has to be redrawn on top.
    import math
    c, s = math.cos(math.radians(tilt)), math.sin(math.radians(tilt))
    x0, y0 = cx + rx * c, cy + rx * s
    x1, y1 = cx - rx * c, cy - rx * s

    tx, ty = cx - 110, cy - 145

    return f'''
  <g transform="translate({cx} {cy}) scale({scale}) translate({-cx} {-cy})">
    <ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}"
             transform="rotate({tilt} {cx} {cy})"
             fill="none" stroke="url(#ring)" stroke-width="15"/>

    <g transform="translate({tx} {ty})">
      <path d="{TOOTH}" fill="url(#tooth)"/>
      <path d="{TOOTH_GLOSS}" fill="#FFFFFF" opacity="0.28"/>
    </g>

    <path d="M {x0:.1f} {y0:.1f} A {rx} {ry} {tilt} 0 1 {x1:.1f} {y1:.1f}"
          fill="none" stroke="url(#ring)" stroke-width="15" stroke-linecap="round"/>

    <g fill="url(#spark)">
      <path d="{sparkle(cx + 196, cy - 148, 30)}"/>
      <path d="{sparkle(cx + 246, cy - 186, 18)}"/>
      <path d="{sparkle(cx + 152, cy - 196, 13)}"/>
    </g>
  </g>'''


def page(body: str, width: int, height: int) -> str:
    faces = ''.join(
        f'''@font-face {{
             font-family: 'Montserrat';
             font-weight: {weight};
             font-display: block;
             src: url(data:font/woff2;base64,{data}) format('woff2');
           }}'''
        for weight, data in FONTS
    )
    return f'''<!doctype html>
<html><head><meta charset="utf-8"><style>
{faces}
html, body {{ margin: 0; padding: 0; background: transparent; }}
svg {{ display: block; }}
</style></head>
<body>
<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}"
     viewBox="0 0 {width} {height}">
{defs()}
{body}
</svg>
</body></html>'''


LOCKUP_W, LOCKUP_H = 1600, 780
lockup = page(
    symbol(800, 300, 1.26)
    + f'''
  <text x="800" y="644" text-anchor="middle"
        font-family="Montserrat" font-weight="700" font-size="142"
        letter-spacing="2" fill="{NAVY}">GALACLINIC</text>
  <text x="800" y="722" text-anchor="middle"
        font-family="Montserrat" font-weight="500" font-size="40"
        letter-spacing="7" fill="{MID_BLUE}">KARLOVY VARY | ZUBNÍ ORDINACE</text>''',
    LOCKUP_W, LOCKUP_H,
)

# The mark's ink is not centred on the tooth: the ring reaches further left
# than right, and the sparkles reach further right and up. Offset the drawing
# by half that imbalance, or the sparkles clip the right edge while the bottom
# sits empty. The two constants are the bbox centre measured in symbol units.
MARK = 512
MARK_SCALE = 0.96
BBOX_DX, BBOX_DY = 28.5, -33.5
mark = page(
    symbol(MARK / 2 - BBOX_DX * MARK_SCALE, MARK / 2 - BBOX_DY * MARK_SCALE, MARK_SCALE),
    MARK, MARK,
)

WORK.mkdir(parents=True, exist_ok=True)
(WORK / 'lockup.html').write_text(lockup, encoding='utf-8')
(WORK / 'mark.html').write_text(mark, encoding='utf-8')

# iOS composites a home-screen icon onto black, so the transparent mark would
# come out as a dark tile with a barely visible tooth. Give that one an opaque
# card of its own.
(WORK / 'apple.html').write_text(
    mark.replace('background: transparent;', 'background: #FFFFFF;'),
    encoding='utf-8',
)

SHOT = WORK / 'shoot.mjs'
SHOT.write_text(
    '''
import { chromium } from 'playwright';
const jobs = JSON.parse(process.argv[2]);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const j of jobs) {
  const page = await browser.newPage({
    viewport: { width: j.w, height: j.h },
    deviceScaleFactor: 1,
  });
  await page.goto('file://' + j.html);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: j.png, omitBackground: !j.opaque });
  console.log('wrote', j.png);
  await page.close();
}
await browser.close();
''',
    encoding='utf-8',
)

# The site header wants the full lockup; the Mini App header already prints
# the clinic name in text beside the image, so it gets the symbol alone.
jobs = [
    {'html': str(WORK / 'lockup.html'),
     'png': str(REPO / 'site' / 'public' / 'logo.png'), 'w': LOCKUP_W, 'h': LOCKUP_H},
    {'html': str(WORK / 'mark.html'),
     'png': str(REPO / 'telegram-app' / 'public' / 'logo.png'), 'w': MARK, 'h': MARK},
    # The site needs the symbol too — its header shows the mark beside the name
    # in live text, because a shrunk lockup is an unreadable lockup.
    {'html': str(WORK / 'mark.html'),
     'png': str(REPO / 'site' / 'public' / 'logo-mark.png'), 'w': MARK, 'h': MARK},
    # Next.js picks these up from app/ by filename and emits the <link> tags.
    {'html': str(WORK / 'mark.html'),
     'png': str(REPO / 'site' / 'src' / 'app' / 'icon.png'), 'w': MARK, 'h': MARK},
    {'html': str(WORK / 'apple.html'), 'opaque': True,
     'png': str(REPO / 'site' / 'src' / 'app' / 'apple-icon.png'), 'w': MARK, 'h': MARK},
]

if not (WORK / 'node_modules' / 'playwright').exists():
    subprocess.run(['npm', 'install', '--no-audit', '--no-fund', '--no-save', 'playwright@1'],
                   cwd=WORK, check=True, stdout=subprocess.DEVNULL)

subprocess.run(['node', str(SHOT), json.dumps(jobs)], check=True, cwd=WORK)
