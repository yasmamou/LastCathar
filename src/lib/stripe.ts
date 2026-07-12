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

import { PLAN_INFO, type PlanKey, type PlanInfo } from '@/lib/plans'

export type { PlanKey }

export interface PlanConfig extends PlanInfo {
  priceId: string | undefined
}

// Server-side plan config = shared plan data + Stripe price ids from env.
// Client components should import PLAN_INFO from '@/lib/plans' instead, so the
// stripe SDK never lands in the browser bundle.
export const PLANS: Record<PlanKey, PlanConfig> = {
  SINGLE: { ...PLAN_INFO.SINGLE, priceId: process.env.STRIPE_PRICE_SINGLE },
  PACK_10: { ...PLAN_INFO.PACK_10, priceId: process.env.STRIPE_PRICE_PACK_10 },
}

export function planFromPriceId(priceId: string | null | undefined): PlanKey | null {
  if (!priceId) return null
  if (priceId === PLANS.SINGLE.priceId) return 'SINGLE'
  if (priceId === PLANS.PACK_10.priceId) return 'PACK_10'
  return null
}

// Pass Audioguides — paiement unique de 5 € qui débloque tous les guides audio.
export const AUDIO_PASS = {
  priceId: process.env.STRIPE_PRICE_AUDIO,
  amount: 500, // centimes (5,00 €)
  name: 'Pass Audioguides — Last Cathar',
}
