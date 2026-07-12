// Installe Stripe pour Last Cathar : crée les 2 produits d'abonnement
// (Vitrine unique 50 €/mois, Pack Marchand 400 €/mois) et écrit les price IDs
// dans .env.local. Idempotent (utilise des lookup_keys).
//
// Prérequis : STRIPE_SECRET_KEY dans .env.local (sk_test_... ou sk_live_...)
// Usage :     npm run stripe:setup
import Stripe from 'stripe'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const ENV_PATH = resolve(__dirname, '../.env.local')

function readEnvLocal(): string {
  try { return readFileSync(ENV_PATH, 'utf8') } catch { return '' }
}

function getEnvValue(content: string, key: string): string | null {
  const m = content.match(new RegExp(`^${key}=(.*)$`, 'm'))
  return m ? m[1].trim().replace(/^"|"$/g, '') : null
}

function setEnvValue(content: string, key: string, value: string): string {
  if (new RegExp(`^${key}=`, 'm').test(content)) {
    return content.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${value}`)
  }
  return content.trimEnd() + `\n${key}=${value}\n`
}

const PLANS = [
  {
    lookupKey: 'lastcathar_single_monthly',
    envKey: 'STRIPE_PRICE_SINGLE',
    productName: 'Vitrine unique — Last Cathar',
    description: '1 emplacement produit sur le lieu de votre choix',
    amount: 5000, // centimes
  },
  {
    lookupKey: 'lastcathar_pack10_monthly',
    envKey: 'STRIPE_PRICE_PACK_10',
    productName: 'Pack Marchand — Last Cathar',
    description: '10 emplacements produits sur les lieux de votre choix',
    amount: 40000,
  },
]

async function main() {
  let env = readEnvLocal()
  const key = process.env.STRIPE_SECRET_KEY || getEnvValue(env, 'STRIPE_SECRET_KEY')

  if (!key || !key.startsWith('sk_')) {
    console.error(`
❌ STRIPE_SECRET_KEY manquante.

1. Créez un compte / connectez-vous : https://dashboard.stripe.com
2. Copiez la clé secrète TEST :     https://dashboard.stripe.com/test/apikeys
3. Ajoutez dans .env.local :        STRIPE_SECRET_KEY=sk_test_...
4. Relancez :                       npm run stripe:setup
`)
    process.exit(1)
  }

  const mode = key.startsWith('sk_test_') ? 'TEST' : 'LIVE'
  console.log(`→ Mode ${mode} (${key.slice(0, 12)}…)\n`)

  const stripe = new Stripe(key, { apiVersion: '2026-06-24.dahlia' })

  for (const plan of PLANS) {
    // Idempotence : cherche un prix existant par lookup_key
    const existing = await stripe.prices.list({ lookup_keys: [plan.lookupKey], limit: 1 })
    let priceId: string

    if (existing.data.length > 0) {
      priceId = existing.data[0].id
      console.log(`✓ ${plan.productName} — prix existant réutilisé (${priceId})`)
    } else {
      const product = await stripe.products.create({
        name: plan.productName,
        description: plan.description,
      })
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.amount,
        currency: 'eur',
        recurring: { interval: 'month' },
        lookup_key: plan.lookupKey,
      })
      priceId = price.id
      console.log(`✓ ${plan.productName} — créé (${(plan.amount / 100).toFixed(0)} €/mois → ${priceId})`)
    }

    env = setEnvValue(env, plan.envKey, priceId)
  }

  // ─── Pass Audioguides — paiement unique 5 € ───
  {
    const lookupKey = 'lastcathar_audio_pass'
    const existing = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 })
    let priceId: string
    if (existing.data.length > 0) {
      priceId = existing.data[0].id
      console.log(`✓ Pass Audioguides — prix existant réutilisé (${priceId})`)
    } else {
      const product = await stripe.products.create({
        name: 'Pass Audioguides — Last Cathar',
        description: 'Accès illimité à tous les guides audio (paiement unique)',
      })
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: 500,
        currency: 'eur',
        lookup_key: lookupKey,
      })
      priceId = price.id
      console.log(`✓ Pass Audioguides — créé (5 € → ${priceId})`)
    }
    env = setEnvValue(env, 'STRIPE_PRICE_AUDIO', priceId)
  }

  writeFileSync(ENV_PATH, env)
  console.log(`\n✓ Price IDs écrits dans .env.local`)

  console.log(`
──────────────────────────────────────────────────────
Il reste 2 étapes (une seule fois) :

▸ Webhook (optionnel en local — la page succès synchronise déjà) :
    En prod : https://dashboard.stripe.com/webhooks
    URL : https://<votre-domaine>/api/stripe/webhook
    Événements : checkout.session.completed, customer.subscription.*, invoice.payment_failed
    → copiez le signing secret dans STRIPE_WEBHOOK_SECRET

▸ Vercel (pour la prod) :
    vercel env add STRIPE_SECRET_KEY
    vercel env add STRIPE_PRICE_SINGLE
    vercel env add STRIPE_PRICE_PACK_10
    vercel env add STRIPE_PRICE_AUDIO
    vercel env add STRIPE_WEBHOOK_SECRET
──────────────────────────────────────────────────────`)
}

main().catch((err) => {
  console.error('❌', err.message ?? err)
  process.exit(1)
})
