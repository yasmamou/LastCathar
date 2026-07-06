#!/bin/bash
# Installe Piper TTS + la voix française masculine naturelle (Tom) pour les
# guides audio. À lancer une seule fois par machine.
#
# Usage: ./scripts/setup-audio-voice.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "→ Installation de Piper TTS…"
python3 -m pip install --user --quiet piper-tts

VOICE_DIR="scripts/voices"
mkdir -p "$VOICE_DIR"
BASE="https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/tom/medium"

if [ ! -f "$VOICE_DIR/fr_FR-tom-medium.onnx" ]; then
  echo "→ Téléchargement de la voix fr_FR-tom-medium (~61 Mo)…"
  curl -sL -o "$VOICE_DIR/fr_FR-tom-medium.onnx" "$BASE/fr_FR-tom-medium.onnx"
  curl -sL -o "$VOICE_DIR/fr_FR-tom-medium.onnx.json" "$BASE/fr_FR-tom-medium.onnx.json"
else
  echo "→ Voix déjà présente."
fi

echo ""
echo "✓ Prêt. Générez les guides avec :  npm run audio:guides"
echo ""
echo "  Autres voix françaises masculines (téléchargez le .onnx + .onnx.json,"
echo "  puis VOICE_MODEL=chemin npm run audio:guides) :"
echo "    • fr_FR-gilles-low   (plus grave, plus rapide)"
echo "    • fr_FR-upmc-medium  (deux voix, --speaker 0/1)"
echo "  Catalogue : https://huggingface.co/rhasspy/piper-voices/tree/main/fr/fr_FR"
