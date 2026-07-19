#!/usr/bin/env bash
# Bascule Stripe entre les modes LIVE et TEST sur la production Vercel.
# Les valeurs sont lues depuis .stripe-live.env / .stripe-test.env (gitignored),
# poussées sur Vercel (production), reflétées dans .env.local, puis redéploiement.
#
# Usage : ./scripts/stripe-switch.sh live   → vrais paiements
#         ./scripts/stripe-switch.sh test   → carte fictive 4242…
set -euo pipefail
cd "$(dirname "$0")/.."

MODE="${1:-}"
[ "$MODE" = "live" ] || [ "$MODE" = "test" ] || { echo "Usage: $0 <live|test>"; exit 1; }
SNAP=".stripe-$MODE.env"
[ -f "$SNAP" ] || { echo "Introuvable : $SNAP"; exit 1; }
[ -f .vercel-token ] || { echo "Introuvable : .vercel-token"; exit 1; }
TOKEN="$(cat .vercel-token)"

echo "▸ Bascule Stripe → $MODE"
while IFS='=' read -r name val; do
  [ -z "$name" ] && continue
  vercel env rm "$name" production --yes --token "$TOKEN" >/dev/null 2>&1 || true
  printf '%s' "$val" | vercel env add "$name" production --token "$TOKEN" >/dev/null 2>&1 && echo "  ✓ $name" || echo "  ✗ $name"
  # reflète aussi en local
  node -e 'const fs=require("fs");let e=fs.readFileSync(".env.local","utf8");const [n,...v]=process.argv[1].split("=");const val=v.join("=");e=new RegExp("^"+n+"=","m").test(e)?e.replace(new RegExp("^"+n+"=.*$","m"),n+"="+val):e.trimEnd()+"\n"+n+"="+val+"\n";fs.writeFileSync(".env.local",e)' "$name=$val"
done < "$SNAP"

echo "▸ Redéploiement production…"
vercel --prod --yes --token "$TOKEN" >/dev/null 2>&1
echo "✓ Stripe est maintenant en mode $MODE sur la production."
