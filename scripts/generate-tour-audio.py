#!/usr/bin/env python3
"""Génère les audios du parcours guidé de Carcassonne (un segment par étape,
FR + EN) avec Piper TTS.

Source  : src/data/carcassonne-tour.json  (stops[].text.{fr,en})
Voix    : fr_FR-tom-medium (FR), en_US-ryan-high (EN)
Sortie  : public/tour/carcassonne/audio/<stop>.fr.m4a et <stop>.en.m4a
Durées  : src/data/carcassonne-tour-durations.json  ("<stop>.fr" / "<stop>.en")

Usage: python3 scripts/generate-tour-audio.py
"""
import json
import os
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "src", "data")
VOICES = os.path.join(ROOT, "scripts", "voices")
TOUR = os.path.join(DATA, "carcassonne-tour.json")
OUT_DIR = os.path.join(ROOT, "public", "tour", "carcassonne", "audio")
DURATIONS = os.path.join(DATA, "carcassonne-tour-durations.json")

LANGS = {
    "fr": {"model": os.path.join(VOICES, "fr_FR-tom-medium.onnx"), "length": "1.12"},
    "en": {"model": os.path.join(VOICES, "en_US-ryan-high.onnx"), "length": "1.05"},
}
PAUSE_SEC = "0.5"


def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, **kw)


def ffprobe_duration(path):
    out = run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
               "-of", "default=noprint_wrappers=1:nokey=1", path])
    try:
        return round(float(out.stdout.decode().strip()))
    except Exception:
        return 0


def main():
    for lang, cfg in LANGS.items():
        if not os.path.exists(cfg["model"]):
            print(f"❌ Voix {lang} absente ({cfg['model']}). Lance ./scripts/setup-audio-voice.sh",
                  file=sys.stderr)
            sys.exit(1)

    with open(TOUR, encoding="utf-8") as fh:
        tour = json.load(fh)

    os.makedirs(OUT_DIR, exist_ok=True)
    durations = {}

    with tempfile.TemporaryDirectory() as tmp:
        sil = os.path.join(tmp, "sil.wav")
        run(["ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=22050:cl=mono", "-t", PAUSE_SEC, sil])

        for stop in tour["stops"]:
            sid = stop["id"]
            for lang, cfg in LANGS.items():
                paras = [p.strip() for p in stop["text"][lang].split("\n\n") if p.strip()]
                parts = []
                for i, para in enumerate(paras):
                    w = os.path.join(tmp, f"{sid}_{lang}_{i}.wav")
                    run([sys.executable, "-m", "piper", "--model", cfg["model"],
                         "--length-scale", cfg["length"], "--output-file", w],
                        input=para.encode("utf-8"))
                    parts.append(w)
                    if i < len(paras) - 1:
                        parts.append(sil)

                lst = os.path.join(tmp, f"{sid}_{lang}.txt")
                with open(lst, "w") as fh:
                    for p in parts:
                        fh.write(f"file '{p}'\n")
                joined = os.path.join(tmp, f"{sid}_{lang}.wav")
                run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", joined])

                key = f"{sid}.{lang}"
                out_m4a = os.path.join(OUT_DIR, f"{key}.m4a")
                run(["ffmpeg", "-y", "-i", joined, "-c:a", "aac", "-b:a", "96k", out_m4a])
                durations[key] = ffprobe_duration(out_m4a)
                print(f"  ✓ {key}  ({durations[key]}s)")

    with open(DURATIONS, "w", encoding="utf-8") as fh:
        json.dump(durations, fh, ensure_ascii=False, indent=2)

    total = sum(durations.values())
    print(f"\n✓ {len(durations)} segments ({total // 60} min {total % 60}s) dans public/tour/carcassonne/audio/")


if __name__ == "__main__":
    main()
