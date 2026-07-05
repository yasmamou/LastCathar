import type Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { PLANS, planFromPriceId } from '@/lib/stripe'

// Shared subscription persistence — used by BOTH the Stripe webhook and the
// /api/stripe/sync fallback (success page). The webhook is the source of truth
// in production; the sync route makes the flow work without webhook config
// (local dev) and covers webhook delivery failures.

export async function upsertSubscription(stripeSub: Stripe.Subscription, fallbackUserId?: string) {
  const userId = stripeSub.metadata?.userId || fallbackUserId
  if (!userId) return null

  const item = stripeSub.items.data[0]
  const priceId = item?.price.id
  const planKey = planFromPriceId(priceId)
  if (!planKey) return null

  const slots = PLANS[planKey].slots
  const status = mapStatus(stripeSub.status)
  const customerId = typeof stripeSub.customer === 'string' ? stripeSub.customer : stripeSub.customer.id
  const periodEnd = item?.current_period_end ? new Date(item.current_period_end * 1000) : null

  const sub = await prisma.subscription.upsert({
    where: { stripeSubId: stripeSub.id },
    create: {
      userId,
      plan: planKey,
      status,
      slotsIncluded: slots,
      stripeCustomerId: customerId,
      stripeSubId: stripeSub.id,
      stripePriceId: priceId,
      currentPeriodEnd: periodEnd,
    },
    update: {
      plan: planKey,
      status,
      slotsIncluded: slots,
      stripeCustomerId: customerId,
      stripePriceId: priceId,
      currentPeriodEnd: periodEnd,
    },
  })

  // Active subscribers become sellers
  if (status === 'ACTIVE') {
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'SELLER' },
    }).catch(() => {})
  }

  return sub
}

export function mapStatus(stripeStatus: Stripe.Subscription.Status) {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'ACTIVE' as const
    case 'past_due':
    case 'unpaid':
      return 'PAST_DUE' as const
    case 'canceled':
    case 'incomplete_expired':
      return 'CANCELLED' as const
    default:
      return 'EXPIRED' as const
  }
}
