import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { stripe, planFromPriceId, PLANS } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const sig = request.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!sig || !secret) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
  }

  const body = await request.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'invalid signature'
    return NextResponse.json({ error: `Webhook invalide: ${msg}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        await upsertSubscription(sub)
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await prisma.subscription.updateMany({
          where: { stripeSubId: sub.id },
          data: { status: 'CANCELLED' },
        })
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subId = invoice.parent?.subscription_details?.subscription
        if (subId) {
          await prisma.subscription.updateMany({
            where: { stripeSubId: typeof subId === 'string' ? subId : subId.id },
            data: { status: 'PAST_DUE' },
          })
        }
        break
      }
    }
  } catch (err) {
    console.error('[stripe webhook]', event.type, err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId || session.client_reference_id
  if (!userId || !session.subscription) return

  const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id
  const stripeSub = await stripe.subscriptions.retrieve(subId)
  await upsertSubscription(stripeSub, userId)

  await prisma.user.update({
    where: { id: userId },
    data: { role: 'SELLER' },
  }).catch(() => {})
}

async function upsertSubscription(stripeSub: Stripe.Subscription, fallbackUserId?: string) {
  const userId = stripeSub.metadata?.userId || fallbackUserId
  if (!userId) return

  const item = stripeSub.items.data[0]
  const priceId = item?.price.id
  const planKey = planFromPriceId(priceId)
  if (!planKey) return

  const slots = PLANS[planKey].slots
  const status = mapStatus(stripeSub.status)
  const customerId = typeof stripeSub.customer === 'string' ? stripeSub.customer : stripeSub.customer.id
  const periodEnd = item?.current_period_end ? new Date(item.current_period_end * 1000) : null

  await prisma.subscription.upsert({
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
}

function mapStatus(stripeStatus: Stripe.Subscription.Status) {
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
