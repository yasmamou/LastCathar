import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { upsertSubscription } from '@/lib/subscription-sync'

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
  if (!userId) return

  // Pass Audioguides — paiement unique : débloque les guides audio.
  if (session.metadata?.type === 'audio') {
    if (session.payment_status === 'paid') {
      await prisma.user.update({ where: { id: userId }, data: { audioAccess: true } }).catch(() => {})
    }
    return
  }

  if (!session.subscription) return
  const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id
  const stripeSub = await stripe.subscriptions.retrieve(subId)
  await upsertSubscription(stripeSub, userId)
}
