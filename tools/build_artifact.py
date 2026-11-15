"""Build the Claude artifact copy of Time tracker from index.html.

The GitHub Pages site and the Claude artifact run the same app. The artifact
can't load files next to the page or use a service worker, so this script:
  - builds the Home Screen icon into the page,
  - drops the manifest and icon links,
  - drops the service worker registration.

Usage:  python tools/build_artifact.py [output.html]
Default output: artifact/index.html (git-ignored). Publish that file to the
artifact link in README.md.
"""
import base64
import pathlib
import re
import sys

root = pathlib.Path(__file__).resolve().parent.parent
src = (root / 'index.html').read_text(encoding='utf-8')
out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'artifact' / 'index.html'

icon = base64.b64encode((root / 'icons' / 'icon-180.png').read_bytes()).decode('ascii')

def drop(pattern, text, count=1):
    new, n = re.subn(pattern, '', text, flags=re.S)
    if n != count:
        sys.exit(f'build_artifact: expected {count} match(es) for {pattern!r}, found {n}')
    return new

html = src
html = html.replace('<link rel="apple-touch-icon" href="icons/icon-180.png">',
                    '<link rel="apple-touch-icon" href="data:image/png;base64,' + icon + '">', 1)
html = drop(r"icon: 'icons/icon-192\.png', badge: 'icons/icon-192\.png', ", html)
html = drop(r'<link rel="icon"[^>]*>\n', html)
html = drop(r'<link rel="manifest"[^>]*>\n', html)
html = drop(r"  if \('serviceWorker' in navigator && location\.protocol !== 'file:'\) \{\n.*?\n  \}\n", html)
if 'icons/' in html or 'sw.js' in html:
    sys.exit('build_artifact: a reference to icons/ or sw.js is still in the page')

out.parent.mkdir(parents=True, exist_ok=True)
with open(out, 'w', encoding='utf-8', newline='\n') as f:
    f.write(html)
print(f'wrote {out} ({len(html):,} bytes)')
