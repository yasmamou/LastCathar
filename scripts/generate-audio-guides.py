#!/usr/bin/env python3
"""Génère les guides audio multilingues avec Piper TTS (voix naturelles, open source).

Langues (LANGS ci-dessous) :
  fr → fr_FR-tom-medium   → public/audio-guides/<slug>.m4a
  en → en_US-ryan-high    → public/audio-guides/<slug>.en.m4a

Sources : src/data/audio-guides-content.json      (fr)
          src/data/audio-guides-content.en.json    (en)
Effet de bord : durées réelles dans src/data/audio-guides-durations.json
                (clés : "<slug>" pour fr, "<slug>.en" pour en), lues par
                src/data/audio-guides.ts.

Prérequis :
  ./scripts/setup-audio-voice.sh   (pip install piper-tts + modèles de voix)
  ffmpeg (brew install ffmpeg)

Usage : npm run audio:guides
        npm run audio:guides fr        # une seule langue
        LENGTH_SCALE=1.15 npm run audio:guides
"""
import json
import os
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "src", "data")
VOICES = os.path.join(ROOT, "scripts", "voices")
OUT_DIR = os.path.join(ROOT, "public", "audio-guides")
DURATIONS = os.path.join(DATA, "audio-guides-durations.json")

# Configuration des langues : (code, fichier contenu, modèle, suffixe fichier, length-scale)
LANGS = [
    {
        "code": "fr",
        "content": os.path.join(DATA, "audio-guides-content.json"),
        # FR : UPMC voix 0 (masculine, grave, moins robotique) + prosodie expressive.
        "model": os.environ.get("VOICE_MODEL_FR", os.path.join(VOICES, "fr_FR-upmc-medium.onnx")),
        "suffix": "",            # <slug>.m4a
        "length": os.environ.get("LENGTH_SCALE", "1.05"),
        "extra": ["--noise-scale", "0.7", "--noise-w", "0.9", "--speaker", "0"],
    },
    {
        "code": "en",
        "content": os.path.join(DATA, "audio-guides-content.en.json"),
        "model": os.environ.get("VOICE_MODEL_EN", os.path.join(VOICES, "en_US-ryan-high.onnx")),
        "suffix": ".en",         # <slug>.en.m4a
        "length": os.environ.get("LENGTH_SCALE_EN", "1.05"),
        "extra": [],
    },
]

PAUSE_SEC = "0.55"  # silence entre paragraphes


def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, **kw)


def ffprobe_duration(path: str) -> int:
    out = run([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", path,
    ])
    try:
        return round(float(out.stdout.decode().strip()))
    except Exception:
        return 0


def synth_paragraph(model: str, length: str, text: str, out_wav: str, extra=None):
    run([
        sys.executable, "-m", "piper",
        "--model", model,
        "--length-scale", length,
        *(extra or []),
        "--output-file", out_wav,
    ], input=text.encode("utf-8"))


def generate_lang(lang, sil_wav, tmp, durations):
    if not os.path.exists(lang["model"]):
        print(f"⏭  {lang['code']} : modèle absent ({os.path.basename(lang['model'])}) — "
              f"lance ./scripts/setup-audio-voice.sh", file=sys.stderr)
        return 0
    if not os.path.exists(lang["content"]):
        print(f"⏭  {lang['code']} : contenu absent ({os.path.basename(lang['content'])})", file=sys.stderr)
        return 0

    with open(lang["content"], encoding="utf-8") as fh:
        data = json.load(fh)

    print(f"\n▸ {lang['code'].upper()}  ({os.path.basename(lang['model'])})")
    count = 0
    for g in data["guides"]:
        slug = g["slug"]
        paras = [p.strip() for p in g["text"].split("\n\n") if p.strip()]
        parts = []
        for i, para in enumerate(paras):
            w = os.path.join(tmp, f"{lang['code']}_{slug}_{i}.wav")
            synth_paragraph(lang["model"], lang["length"], para, w, lang.get("extra"))
            parts.append(w)
            if i < len(paras) - 1:
                parts.append(sil_wav)

        concat = os.path.join(tmp, f"{lang['code']}_{slug}_list.txt")
        with open(concat, "w") as fh:
            for p in parts:
                fh.write(f"file '{p}'\n")

        joined = os.path.join(tmp, f"{lang['code']}_{slug}.wav")
        run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat, "-c", "copy", joined])

        key = f"{slug}{lang['suffix']}"
        out_m4a = os.path.join(OUT_DIR, f"{key}.m4a")
        run(["ffmpeg", "-y", "-i", joined, "-c:a", "aac", "-b:a", "96k", out_m4a])

        durations[key] = ffprobe_duration(out_m4a)
        print(f"  ✓ {key}  ({durations[key]}s)")
        count += 1
    return count


def main():
    only = sys.argv[1] if len(sys.argv) > 1 else None
    langs = [l for l in LANGS if not only or l["code"] == only]

    os.makedirs(OUT_DIR, exist_ok=True)

    # On repart des durées existantes pour ne pas perdre les langues non régénérées
    durations = {}
    if os.path.exists(DURATIONS):
        with open(DURATIONS, encoding="utf-8") as fh:
            durations = json.load(fh)

    total_count = 0
    with tempfile.TemporaryDirectory() as tmp:
        sil = os.path.join(tmp, "sil.wav")
        run(["ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=22050:cl=mono", "-t", PAUSE_SEC, sil])
        for lang in langs:
            total_count += generate_lang(lang, sil, tmp, durations)

    with open(DURATIONS, "w", encoding="utf-8") as fh:
        json.dump(durations, fh, ensure_ascii=False, indent=2)

    total_sec = sum(durations.values())
    print(f"\n✓ {total_count} pistes générées dans public/audio-guides/  "
          f"(~{total_sec // 60} min au total, toutes langues)")
    print(f"✓ Durées écrites dans {os.path.relpath(DURATIONS, ROOT)}")


if __name__ == "__main__":
    main()
