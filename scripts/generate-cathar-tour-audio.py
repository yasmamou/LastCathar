#!/usr/bin/env python3
"""Génère les audios (Piper FR/EN) des visites de l'épopée cathare.

Lit src/data/cathar-tours.json, produit public/tour/<placeSlug>/audio/<stopId>.<lang>.m4a
via scripts/gen-narration.py, et écrit les durées dans
src/data/cathar-tours-durations.json (clé "<placeSlug>/<stopId>.<lang>").

Usage : python3 scripts/generate-cathar-tour-audio.py [--force] [placeSlug ...]
  - sans argument : tous les lieux du JSON
  - avec des slugs : seulement ceux-là
  - --force : régénère même si le fichier existe déjà
"""
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOURS = os.path.join(ROOT, 'src', 'data', 'cathar-tours.json')
DURATIONS = os.path.join(ROOT, 'src', 'data', 'cathar-tours-durations.json')
GEN = os.path.join(ROOT, 'scripts', 'gen-narration.py')
LANGS = ('fr', 'en')

args = sys.argv[1:]
force = '--force' in args
only = [a for a in args if not a.startswith('--')]


def duration(path):
    r = subprocess.run(
        ['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
         '-of', 'default=noprint_wrappers=1:nokey=1', path],
        capture_output=True, text=True,
    )
    try:
        return round(float(r.stdout.strip()), 2)
    except ValueError:
        return 40.0


def main():
    with open(TOURS, encoding='utf-8') as f:
        data = json.load(f)
    durations = {}
    if os.path.exists(DURATIONS):
        try:
            with open(DURATIONS, encoding='utf-8') as f:
                durations = json.load(f)
        except json.JSONDecodeError:
            durations = {}

    total, done, skipped, failed = 0, 0, 0, 0
    for tour in data['tours']:
        slug = tour['placeSlug']
        if only and slug not in only:
            continue
        out_dir = os.path.join(ROOT, 'public', 'tour', slug, 'audio')
        os.makedirs(out_dir, exist_ok=True)
        for stop in tour['stops']:
            for lang in LANGS:
                total += 1
                sid = stop['id']
                out = os.path.join(out_dir, f'{sid}.{lang}.m4a')
                key = f'{slug}/{sid}.{lang}'
                if os.path.exists(out) and not force:
                    durations[key] = durations.get(key) or duration(out)
                    skipped += 1
                    continue
                text = stop['text'][lang].strip()
                print(f'▶ {slug}/{sid} [{lang}] …', flush=True)
                p = subprocess.run(
                    [sys.executable, GEN, lang, out],
                    input=text.encode('utf-8'), capture_output=True,
                )
                if p.returncode != 0 or not os.path.exists(out):
                    print(f'  ✗ échec : {p.stderr.decode()[-200:]}', flush=True)
                    failed += 1
                    continue
                durations[key] = duration(out)
                done += 1

    with open(DURATIONS, 'w', encoding='utf-8') as f:
        json.dump(durations, f, ensure_ascii=False, indent=0)
    print(f'\n✓ Terminé — {done} générés, {skipped} déjà présents, {failed} échecs (sur {total}).')
    print(f'  Durées écrites dans {DURATIONS}')


if __name__ == '__main__':
    main()
