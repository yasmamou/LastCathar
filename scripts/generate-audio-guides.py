#!/usr/bin/env python3
"""Génère les guides audio avec Piper TTS (voix française naturelle, open source).

Voix par défaut : fr_FR-tom-medium (masculine, naturelle).
Source unique : src/data/audio-guides-content.json (slug, title, text).
Sortie        : public/audio-guides/<slug>.m4a  (AAC ~96 kbps, léger pour le web)
Effet de bord : écrit les durées réelles dans src/data/audio-guides-durations.json,
                lu par src/data/audio-guides.ts.

Prérequis :
  pip3 install --user piper-tts
  # modèle (une fois) — voir MODEL_PATH ci-dessous / scripts/setup-audio-voice.sh
  ffmpeg (brew install ffmpeg)

Usage : npm run audio:guides
        VOICE_MODEL=/chemin/vers/autre.onnx npm run audio:guides   # changer de voix
"""
import json
import os
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, "src", "data", "audio-guides-content.json")
DURATIONS = os.path.join(ROOT, "src", "data", "audio-guides-durations.json")
OUT_DIR = os.path.join(ROOT, "public", "audio-guides")

# Voix : surchargeable via la variable d'env VOICE_MODEL
MODEL = os.environ.get(
    "VOICE_MODEL",
    os.path.join(ROOT, "scripts", "voices", "fr_FR-tom-medium.onnx"),
)
# Débit : > 1 = plus lent / posé (voix de documentaire). 1.10 ≈ narration calme.
LENGTH_SCALE = os.environ.get("LENGTH_SCALE", "1.12")
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


def synth_paragraph(text: str, out_wav: str):
    run([
        sys.executable, "-m", "piper",
        "--model", MODEL,
        "--length-scale", LENGTH_SCALE,
        "--output-file", out_wav,
    ], input=text.encode("utf-8"))


def main():
    if not os.path.exists(MODEL):
        print(f"❌ Modèle de voix introuvable : {MODEL}\n"
              f"   Lance d'abord : ./scripts/setup-audio-voice.sh", file=sys.stderr)
        sys.exit(1)

    with open(CONTENT, encoding="utf-8") as fh:
        data = json.load(fh)

    os.makedirs(OUT_DIR, exist_ok=True)
    durations = {}

    with tempfile.TemporaryDirectory() as tmp:
        sil = os.path.join(tmp, "sil.wav")
        run(["ffmpeg", "-y", "-f", "lavfi", "-i",
             "anullsrc=r=22050:cl=mono", "-t", PAUSE_SEC, sil])

        for g in data["guides"]:
            slug = g["slug"]
            paras = [p.strip() for p in g["text"].split("\n\n") if p.strip()]
            parts = []
            for i, para in enumerate(paras):
                w = os.path.join(tmp, f"{slug}_{i}.wav")
                synth_paragraph(para, w)
                parts.append(w)
                if i < len(paras) - 1:
                    parts.append(sil)

            concat = os.path.join(tmp, f"{slug}_list.txt")
            with open(concat, "w") as fh:
                for p in parts:
                    fh.write(f"file '{p}'\n")

            joined = os.path.join(tmp, f"{slug}.wav")
            run(["ffmpeg", "-y", "-f", "concat", "-safe", "0",
                 "-i", concat, "-c", "copy", joined])

            out_m4a = os.path.join(OUT_DIR, f"{slug}.m4a")
            run(["ffmpeg", "-y", "-i", joined,
                 "-c:a", "aac", "-b:a", "96k", out_m4a])

            durations[slug] = ffprobe_duration(out_m4a)
            print(f"  ✓ {slug}  ({durations[slug]}s)")

    with open(DURATIONS, "w", encoding="utf-8") as fh:
        json.dump(durations, fh, ensure_ascii=False, indent=2)

    total = sum(durations.values())
    print(f"\n✓ {len(durations)} guides générés dans public/audio-guides/  "
          f"(~{total // 60} min {total % 60}s au total)")
    print(f"✓ Durées écrites dans {os.path.relpath(DURATIONS, ROOT)}")


if __name__ == "__main__":
    main()
