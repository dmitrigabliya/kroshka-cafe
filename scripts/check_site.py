#!/usr/bin/env python3
"""Check deployable files and local links without third-party dependencies."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import re
import sys

ROOT = Path(__file__).resolve().parents[1] / 'dist'
errors = []


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.path, self.ids, self.links = path, set(), []
        self.h1_count = 0

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        identifier = attrs.get('id')
        if identifier:
            if identifier in self.ids:
                errors.append(f'{self.path.name}: duplicate id {identifier}')
            self.ids.add(identifier)
        if tag == 'h1':
            self.h1_count += 1
        if tag == 'img' and 'alt' not in attrs:
            errors.append(f'{self.path.name}: image without alt')
        if tag == 'a' and attrs.get('href') == '#':
            errors.append(f'{self.path.name}: placeholder link')
        for name in ('src', 'href'):
            if attrs.get(name):
                self.links.append(attrs[name])


pages = {}
for path in ROOT.glob('*.html'):
    page = Page(path)
    page.feed(path.read_text())
    if page.h1_count != 1:
        errors.append(f'{path.name}: expected one h1, got {page.h1_count}')
    pages[path.resolve()] = page

for path, page in pages.items():
    for link in page.links:
        parsed = urlsplit(link)
        if parsed.scheme or parsed.netloc or link.startswith('//'):
            continue
        target = (path.parent / unquote(parsed.path)).resolve() if parsed.path else path
        if not target.is_relative_to(ROOT.resolve()):
            errors.append(f'{path.name}: link escapes dist: {link}')
            continue
        if not target.exists():
            errors.append(f'{path.name}: missing local file: {link}')
        if parsed.fragment and target in pages and unquote(parsed.fragment) not in pages[target].ids:
            errors.append(f'{path.name}: missing anchor: {link}')

for path in ROOT.glob('*.css'):
    for link in re.findall(r'url\([\'\"]?([^\)\'\"]+)', path.read_text()):
        if urlsplit(link).scheme or link.startswith('#'):
            continue
        if not (path.parent / unquote(urlsplit(link).path)).is_file():
            errors.append(f'{path.name}: missing CSS asset: {link}')

catalogue = (ROOT / 'menu.js').read_text()
for photo in set(re.findall(r"photo:'([^']+)'", catalogue)):
    if not (ROOT / 'assets' / f'{photo}.jpg').is_file():
        errors.append(f'menu.js: missing product photo: {photo}')

if errors:
    print('\n'.join(errors))
    sys.exit(1)
print(f'OK: {len(pages)} HTML pages, local files, anchors, image alt text and catalogue photos.')
