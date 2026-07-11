#!/usr/bin/env python3
"""Récupère des images/gravures libres (Wikimedia Commons) pour les lieux de
l'épopée cathare qui n'ont pas d'illustration, et écrit un fichier d'overrides
src/data/place-image-overrides.json (slug -> { heroImageUrl, imageUrls, credit }).

Usage: python3 scripts/fetch-cathar-images.py
"""
import json
import os
import re
import time
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "src", "data", "place-image-overrides.json")
UA = "LastCathar/1.0 (educational storytelling)"

# slug -> termes de recherche (on prend jusqu'à 2 images, la 1ère = héros)
TARGETS = {
    "massacre-de-beziers": ["Sac de Béziers 1209", "Croisade des albigeois Béziers"],
    "chateau-de-lastours": ["Châteaux de Lastours", "Cabaret Lastours château"],
    "chateau-de-foix": ["Château de Foix", "Château de Foix Ariège"],
    "chateau-de-puivert": ["Château de Puivert", "Puivert château cathare"],
    "abbaye-de-fontfroide": ["Abbaye de Fontfroide", "Fontfroide cloître"],
    "chateau-de-queribus": ["Château de Quéribus", "Quéribus donjon"],
    "chateau-de-peyrepertuse": ["Château de Peyrepertuse", "Peyrepertuse forteresse"],
    "or-des-cathares": ["Cathares bûcher gravure", "Albigenses"],
    "otto-rahn-quete-du-graal": ["Otto Rahn", "Montségur Otto Rahn"],
    "sentier-cathare": ["Château cathare paysage", "Corbières château cathare"],
}


def strip_html(s):
    return re.sub("<[^>]+>", "", s or "").strip()


def search(term, attempt=0):
    q = urllib.parse.urlencode({
        "action": "query", "format": "json", "generator": "search",
        "gsrsearch": term, "gsrlimit": 3, "gsrnamespace": 6,
        "prop": "imageinfo", "iiprop": "url|extmetadata", "iiurlwidth": 1280,
    })
    req = urllib.request.Request("https://commons.wikimedia.org/w/api.php?" + q,
                                 headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            data = json.load(r)
    except urllib.error.HTTPError as e:
        if e.code == 429 and attempt < 4:
            time.sleep(3 * (attempt + 1))
            return search(term, attempt + 1)
        raise
    time.sleep(1.2)  # rester poli avec l'API
    pages = sorted(data.get("query", {}).get("pages", {}).values(),
                   key=lambda p: p.get("index", 999))
    for p in pages:
        ii = p.get("imageinfo", [{}])[0]
        url = ii.get("thumburl") or ii.get("url")
        ext = (url or "").lower().rsplit(".", 1)[-1].split("?")[0] if url else ""
        if not url or ext not in ("jpg", "jpeg", "png"):
            continue
        meta = ii.get("extmetadata", {})
        return {
            "url": url,
            "artist": strip_html(meta.get("Artist", {}).get("value", "Wikimedia Commons"))[:80],
            "license": strip_html(meta.get("LicenseShortName", {}).get("value", "CC / PD"))[:40],
        }
    return None


def main():
    overrides = {}
    for slug, terms in TARGETS.items():
        urls, credit = [], None
        for term in terms:
            info = search(term)
            if info and info["url"] not in urls:
                urls.append(info["url"])
                if credit is None:
                    credit = f"{info['artist']} — {info['license']}"
        if urls:
            overrides[slug] = {
                "heroImageUrl": urls[0],
                "imageUrls": urls,
                "credit": credit,
            }
            print(f"  ✓ {slug}  ({credit})")
        else:
            print(f"  ⚠ {slug} : aucune image trouvée")

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(overrides, f, ensure_ascii=False, indent=2)
    print(f"\n✓ {len(overrides)} overrides écrits dans {os.path.relpath(OUT, ROOT)}")


if __name__ == "__main__":
    main()
