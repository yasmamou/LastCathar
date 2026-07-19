#!/usr/bin/env python3
"""Récupère de vraies photos pour les visites cathares depuis Wikipédia (FR).

Pour chaque lieu de src/data/cathar-tours.json, lit son article Wikipédia (via le
sourceLinks du lieu), liste ses images, filtre les vraies photos (JPEG, larges,
pas de blasons/cartes/plans) et écrit jusqu'à 6 URLs + crédits dans
src/data/cathar-tour-images.json (clé = placeSlug).

Les sourceLinks sont fournis via un dump JSON (slug -> [liens]) dont le chemin
est passé en 1er argument, ou /tmp/cathar-source-links.json par défaut.

Usage : python3 scripts/fetch-cathar-images.py [dump.json] [placeSlug ...]
"""
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOURS = os.path.join(ROOT, 'src', 'data', 'cathar-tours.json')
OUT = os.path.join(ROOT, 'src', 'data', 'cathar-tour-images.json')
API = 'https://fr.wikipedia.org/w/api.php'
UA = 'LastCathar/1.0 (audioguide project)'
MAX_IMAGES = 6

EXCLUDE = re.compile(
    r'blason|armoiries|coat|carte|\bmap\b|locator|\bplan\b|logo|drapeau|flag|picto|'
    r'icon|\.svg|commons-logo|wikidata|edit-|\.ogg|\.oga|meuble|croix_occitane|'
    r'occitania|languedoc\.svg|region_|d%C3%A9partement',
    re.IGNORECASE,
)

args = [a for a in sys.argv[1:]]
dump = args[0] if args and args[0].endswith('.json') else '/tmp/cathar-source-links.json'
only = [a for a in args if not a.endswith('.json')]


def api(params):
    url = API + '?' + urllib.parse.urlencode({**params, 'format': 'json'})
    for attempt in range(6):
        req = urllib.request.Request(url, headers={'User-Agent': UA})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = 5 * (attempt + 1)
                print(f'   … 429, pause {wait}s', flush=True)
                time.sleep(wait)
                continue
            raise
    raise RuntimeError('429 persistant')


def title_from_source(links):
    for link in links or []:
        m = re.search(r'/wiki/([^?#]+)', link)
        if m and 'wikipedia' in link:
            return urllib.parse.unquote(m.group(1))
    return None


def list_image_titles(article):
    data = api({'action': 'query', 'prop': 'images', 'imlimit': '200', 'titles': article})
    out = []
    for p in data.get('query', {}).get('pages', {}).values():
        for im in p.get('images', []):
            out.append(im['title'])
    return out


def image_infos(file_titles):
    infos = []
    for i in range(0, len(file_titles), 40):
        data = api({
            'action': 'query', 'prop': 'imageinfo',
            'iiprop': 'url|mime|size|extmetadata', 'iiurlwidth': '1280',
            'titles': '|'.join(file_titles[i:i + 40]),
        })
        for p in data.get('query', {}).get('pages', {}).values():
            for ii in p.get('imageinfo', []):
                infos.append((p.get('title', ''), ii))
        time.sleep(0.2)
    return infos


def pick(article):
    infos = image_infos(list_image_titles(article))
    scored = []
    for name, ii in infos:
        if ii.get('mime') != 'image/jpeg':
            continue
        if EXCLUDE.search(name) or EXCLUDE.search(ii.get('url', '')):
            continue
        if ii.get('width', 0) < 800:
            continue
        meta = ii.get('extmetadata', {})
        artist = re.sub(r'<[^>]+>', '', meta.get('Artist', {}).get('value', '')).strip()
        lic = meta.get('LicenseShortName', {}).get('value', '').strip()
        scored.append((ii.get('width', 0), {
            'src': ii.get('thumburl') or ii.get('url'),
            'artist': (artist[:80] or 'Wikimedia Commons'),
            'license': lic or 'CC',
            'source': f'https://fr.wikipedia.org/wiki/{urllib.parse.quote(article)}',
        }))
    scored.sort(key=lambda x: -x[0])
    out, seen = [], set()
    for _, img in scored:
        if img['src'] in seen:
            continue
        seen.add(img['src'])
        out.append(img)
        if len(out) >= MAX_IMAGES:
            break
    return out


def main():
    with open(TOURS, encoding='utf-8') as f:
        tours = json.load(f)['tours']
    with open(dump, encoding='utf-8') as f:
        src_map = json.load(f)

    result = {}
    if os.path.exists(OUT):
        try:
            with open(OUT, encoding='utf-8') as f:
                result = json.load(f)
        except json.JSONDecodeError:
            result = {}

    for t in tours:
        slug = t['placeSlug']
        if only and slug not in only:
            continue
        article = title_from_source(src_map.get(slug, []))
        if not article:
            print(f'⚠ {slug} : pas de lien Wikipédia')
            continue
        try:
            imgs = pick(article)
        except Exception as e:
            print(f'✗ {slug} : {e}')
            continue
        if imgs:
            result[slug] = imgs
            print(f'✓ {slug} : {len(imgs)} photos ({article})')
        else:
            print(f'⚠ {slug} : aucune photo retenue')
        time.sleep(0.3)

    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=1)
    print(f'\n→ {OUT} ({len(result)} lieux)')


if __name__ == '__main__':
    main()
