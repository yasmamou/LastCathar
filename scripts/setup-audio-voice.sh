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
HF="https://huggingface.co/rhasspy/piper-voices/resolve/main"

fetch_voice() {
  local name="$1" path="$2" size="$3"
  if [ ! -f "$VOICE_DIR/$name.onnx" ]; then
    echo "→ Téléchargement de $name ($size)…"
    curl -sL -o "$VOICE_DIR/$name.onnx" "$HF/$path/$name.onnx"
    curl -sL -o "$VOICE_DIR/$name.onnx.json" "$HF/$path/$name.onnx.json"
  else
    echo "→ $name déjà présent."
  fi
}

# Voix masculine française (guides FR) et anglaise (guides EN)
fetch_voice "fr_FR-tom-medium"  "fr/fr_FR/tom/medium"  "~61 Mo"
fetch_voice "en_US-ryan-high"   "en/en_US/ryan/high"   "~115 Mo"

echo ""
echo "✓ Prêt. Générez les guides avec :  npm run audio:guides       (FR + EN)"
echo "                                    npm run audio:guides en    (une langue)"
echo ""
echo "  Autres voix (téléchargez .onnx + .onnx.json, puis VOICE_MODEL_FR / VOICE_MODEL_EN=chemin) :"
echo "    • fr_FR-gilles-low   (masculin, plus grave)      • en_GB-alan-medium (masculin britannique)"
echo "  Catalogue : https://huggingface.co/rhasspy/piper-voices"
