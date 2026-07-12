#!/usr/bin/env python3
"""Récupère les images des NOUVELLES étapes du parcours de Carcassonne et
reconstruit src/data/carcassonne-tour-images.json pour les 20 étapes
(nouvelles images téléchargées + réutilisation des 6 étapes existantes).

Usage: python3 scripts/fetch-tour-extra-images.py
"""
import json
import os
import re
import time
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "public", "tour", "carcassonne")
IMAGES_JSON = os.path.join(ROOT, "src", "data", "carcassonne-tour-images.json")
UA = "LastCathar/1.0 (educational storytelling)"

# Étapes à télécharger : stop_id -> (moteur, requête)
#   commons: recherche Wikimedia Commons ; wiki:<lang>: image de tête d'un article
FETCH = {
    "hourds": ("commons", "Carcassonne hoarding rampart"),
    "les-puits": ("commons", "Château Comtal Carcassonne cour"),
    "theatre": ("commons", "Carcassonne festival theatre"),
    "hotel-de-la-cite": ("url", "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Hotel_de_la_Cite_Carcassonne_02.jpg/960px-Hotel_de_la_Cite_Carcassonne_02.jpg"),
    "embrasement": ("commons", "Carcassonne feu artifice nuit"),
}

# Étapes qui réutilisent une image d'une autre étape déjà téléchargée
REUSE = {
    "siege-1209": "porte-narbonnaise",
    "legendes": "dame-carcas",
    "saint-louis": "chateau-comtal",
    "panorama": "porte-aude",
}


def strip_html(s):
    return re.sub("<[^>]+>", "", s or "").strip()


def commons_search(term, attempt=0):
    q = urllib.parse.urlencode({
        "action": "query", "format": "json", "generator": "search",
        "gsrsearch": term, "gsrlimit": 3, "gsrnamespace": 6,
        "prop": "imageinfo", "iiprop": "url|extmetadata", "iiurlwidth": 1280,
    })
    req = urllib.request.Request("https://commons.wikimedia.org/w/api.php?" + q, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            data = json.load(r)
    except urllib.error.HTTPError as e:
        if e.code == 429 and attempt < 5:
            time.sleep(4 * (attempt + 1)); return commons_search(term, attempt + 1)
        raise
    time.sleep(1.5)
    pages = sorted(data.get("query", {}).get("pages", {}).values(), key=lambda p: p.get("index", 999))
    for p in pages:
        ii = p.get("imageinfo", [{}])[0]
        url = ii.get("thumburl") or ii.get("url")
        ext = (url or "").lower().rsplit(".", 1)[-1].split("?")[0] if url else ""
        if not url or ext not in ("jpg", "jpeg", "png"):
            continue
        m = ii.get("extmetadata", {})
        return url, strip_html(m.get("Artist", {}).get("value", "Wikimedia Commons"))[:70], strip_html(m.get("LicenseShortName", {}).get("value", "CC / PD"))[:35]
    return None


def wiki_lead(lang, title):
    q = urllib.parse.urlencode({"action": "query", "titles": title, "prop": "pageimages", "format": "json", "pithumbsize": 1000})
    req = urllib.request.Request(f"https://{lang}.wikipedia.org/w/api.php?" + q, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.load(r)
    time.sleep(1.0)
    p = list(data.get("query", {}).get("pages", {}).values())[0]
    src = p.get("thumbnail", {}).get("source")
    return (src, "Wikimedia Commons", "domaine public / CC") if src else None


def download(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r, open(dest, "wb") as f:
        f.write(r.read())


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(IMAGES_JSON, encoding="utf-8") as f:
        images = json.load(f)  # 6 étapes existantes

    for stop, (engine, arg) in FETCH.items():
        try:
            if engine == "commons":
                res = commons_search(arg)
            elif engine.startswith("wiki:"):
                res = wiki_lead(engine.split(":")[1], arg)
            elif engine == "url":
                res = (arg, "Wikimedia Commons", "CC / domaine public")
            else:
                res = None
            if not res:
                print(f"  ⚠ {stop} : aucune image"); continue
            url, artist, lic = res
            fname = f"{stop}-1.jpg"
            download(url, os.path.join(OUT_DIR, fname))
            images[stop] = [{"src": f"/tour/carcassonne/{fname}", "artist": artist, "license": lic, "source": ""}]
            print(f"  ✓ {stop}  ({artist} — {lic})")
        except Exception as e:
            print(f"  ⚠ {stop} : échec ({e})")

    for stop, ref in REUSE.items():
        if ref in images:
            images[stop] = images[ref]
            print(f"  ↺ {stop} réutilise {ref}")

    with open(IMAGES_JSON, "w", encoding="utf-8") as f:
        json.dump(images, f, ensure_ascii=False, indent=2)
    print(f"\n✓ {len(images)} étapes avec images dans {os.path.relpath(IMAGES_JSON, ROOT)}")


if __name__ == "__main__":
    main()
