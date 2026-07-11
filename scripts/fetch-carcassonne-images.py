#!/usr/bin/env python3
"""Récupère des photos libres (Wikimedia Commons) des monuments de la Cité de
Carcassonne pour le parcours guidé, et les stocke dans public/tour/carcassonne/.

Écrit aussi les crédits (auteur + licence) dans
src/data/carcassonne-tour-images.json, pour l'affichage.

Usage: python3 scripts/fetch-carcassonne-images.py
"""
import json
import os
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "public", "tour", "carcassonne")
CREDITS = os.path.join(ROOT, "src", "data", "carcassonne-tour-images.json")
UA = "LastCathar/1.0 (https://last-cathar.vercel.app; educational storytelling)"

# stop_id -> liste de termes de recherche (1 image par terme, dans l'ordre)
STOPS = {
    "dame-carcas": ["Dame Carcas Carcassonne buste", "Dame Carcas Carcassonne"],
    "porte-narbonnaise": ["Porte Narbonnaise Carcassonne", "Porte Narbonnaise Pont-Levis Carcassonne"],
    "lices": ["Lices Carcassonne remparts", "Remparts Cité Carcassonne"],
    "chateau-comtal": ["Château Comtal Carcassonne", "Chateau Comtal Carcassonne cour"],
    "basilique-saint-nazaire": ["Basilique Saint-Nazaire Carcassonne", "Vitraux Saint-Nazaire Carcassonne"],
    "porte-aude": ["Porte d'Aude Carcassonne", "Cité de Carcassonne coucher soleil"],
}


def api_search(term):
    q = urllib.parse.urlencode({
        "action": "query", "format": "json", "generator": "search",
        "gsrsearch": term, "gsrlimit": 3, "gsrnamespace": 6,
        "prop": "imageinfo", "iiprop": "url|extmetadata", "iiurlwidth": 1400,
    })
    req = urllib.request.Request(
        "https://commons.wikimedia.org/w/api.php?" + q, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.load(r)
    pages = list(data.get("query", {}).get("pages", {}).values())
    # tri par index de recherche pour garder l'ordre de pertinence
    pages.sort(key=lambda p: p.get("index", 999))
    for p in pages:
        ii = p.get("imageinfo", [{}])[0]
        url = ii.get("thumburl") or ii.get("url")
        if not url or not url.lower().rsplit(".", 1)[-1].split("?")[0] in ("jpg", "jpeg", "png"):
            continue
        meta = ii.get("extmetadata", {})
        artist = strip_html(meta.get("Artist", {}).get("value", "Wikimedia Commons"))
        license_short = meta.get("LicenseShortName", {}).get("value", "CC / domaine public")
        return {
            "url": url,
            "artist": artist[:80],
            "license": strip_html(license_short)[:40],
            "descriptionUrl": ii.get("descriptionurl", ""),
        }
    return None


def strip_html(s):
    import re
    return re.sub("<[^>]+>", "", s or "").strip()


def download(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r, open(dest, "wb") as f:
        f.write(r.read())


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    credits = {}
    for stop, terms in STOPS.items():
        images = []
        for i, term in enumerate(terms):
            info = api_search(term)
            if not info:
                print(f"  ⚠ {stop} / '{term}' : aucun résultat")
                continue
            fname = f"{stop}-{i+1}.jpg"
            dest = os.path.join(OUT_DIR, fname)
            try:
                download(info["url"], dest)
                images.append({
                    "src": f"/tour/carcassonne/{fname}",
                    "artist": info["artist"],
                    "license": info["license"],
                    "source": info["descriptionUrl"],
                })
                print(f"  ✓ {fname}  ({info['artist']} — {info['license']})")
            except Exception as e:
                print(f"  ⚠ {stop} : échec téléchargement ({e})")
        credits[stop] = images

    with open(CREDITS, "w", encoding="utf-8") as f:
        json.dump(credits, f, ensure_ascii=False, indent=2)
    total = sum(len(v) for v in credits.values())
    print(f"\n✓ {total} images dans public/tour/carcassonne/")
    print(f"✓ Crédits écrits dans {os.path.relpath(CREDITS, ROOT)}")


if __name__ == "__main__":
    main()
