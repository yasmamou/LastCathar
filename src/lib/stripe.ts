import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
  stripeInstance = new Stripe(key, {
    apiVersion: '2026-06-24.dahlia',
    typescript: true,
    appInfo: { name: 'Last Cathar', version: '0.1.0' },
  })
  return stripeInstance
}

export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return Reflect.get(getStripe(), prop, getStripe())
  },
})

export type PlanKey = 'SINGLE' | 'PACK_10'

export interface PlanConfig {
  key: PlanKey
  name: string
  tagline: string
  slots: number
  priceMonthly: number
  priceId: string | undefined
  features: string[]
}

export const PLANS: Record<PlanKey, PlanConfig> = {
  SINGLE: {
    key: 'SINGLE',
    name: 'Vitrine unique',
    tagline: 'Un emplacement sur un lieu de votre choix',
    slots: 1,
    priceMonthly: 50,
    priceId: process.env.STRIPE_PRICE_SINGLE,
    features: [
      '1 emplacement produit sur 1 lieu',
      "Statistiques vues + clics en temps réel",
      'Modification illimitée du contenu',
      'Résiliable à tout moment',
    ],
  },
  PACK_10: {
    key: 'PACK_10',
    name: 'Pack Marchand',
    tagline: '10 emplacements — économie de 100 €/mois',
    slots: 10,
    priceMonthly: 400,
    priceId: process.env.STRIPE_PRICE_PACK_10,
    features: [
      '10 emplacements sur les lieux de votre choix',
      "Statistiques détaillées + export CSV",
      'Support prioritaire',
      'Placement mis en avant dans la sidebar',
      'Résiliable à tout moment',
    ],
  },
}

export function planFromPriceId(priceId: string | null | undefined): PlanKey | null {
  if (!priceId) return null
  if (priceId === PLANS.SINGLE.priceId) return 'SINGLE'
  if (priceId === PLANS.PACK_10.priceId) return 'PACK_10'
  return null
}
