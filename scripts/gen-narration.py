#!/usr/bin/env python3
"""Génère une piste voix (Piper) pour un reel. Texte lu sur stdin.

Voix identiques aux audioguides : fr_FR-tom-medium (FR), en_US-ryan-high (EN).
Usage : echo "texte" | python3 scripts/gen-narration.py <fr|en> <sortie.m4a>
"""
import os
import subprocess
import sys
import tempfile

lang = sys.argv[1] if len(sys.argv) > 1 else 'fr'
out = sys.argv[2] if len(sys.argv) > 2 else 'out.m4a'
text = sys.stdin.read().strip()
if not text:
    print('ERR empty text', file=sys.stderr); sys.exit(1)

VOICES = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'voices')
# Voix FR : UPMC voix 0 (masculine, grave, moins robotique) avec prosodie plus
# expressive. Voix EN : ryan.
if lang == 'fr':
    model = os.path.join(VOICES, 'fr_FR-upmc-medium.onnx')
    extra = ['--length-scale', '1.05', '--noise-scale', '0.7', '--noise-w', '0.9', '--speaker', '0']
else:
    model = os.path.join(VOICES, 'en_US-ryan-high.onnx')
    extra = ['--length-scale', '1.05']

if not os.path.exists(model):
    print(f'ERR voice model missing: {model}', file=sys.stderr); sys.exit(2)

with tempfile.TemporaryDirectory() as tmp:
    wav = os.path.join(tmp, 'n.wav')
    p = subprocess.run(
        [sys.executable, '-m', 'piper', '--model', model, *extra, '--output-file', wav],
        input=text.encode('utf-8'), capture_output=True,
    )
    if p.returncode != 0 or not os.path.exists(wav):
        print('ERR piper: ' + p.stderr.decode()[-300:], file=sys.stderr); sys.exit(3)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    c = subprocess.run(['ffmpeg', '-y', '-i', wav, '-c:a', 'aac', '-b:a', '128k', out], capture_output=True)
    if c.returncode != 0:
        print('ERR ffmpeg: ' + c.stderr.decode()[-300:], file=sys.stderr); sys.exit(4)

print('OK ' + out)
