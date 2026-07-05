import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { upsertSubscription } from '@/lib/subscription-sync'

export const dynamic = 'force-dynamic'

// POST /api/stripe/sync { sessionId } — called by the success page after a
// checkout redirect. Retrieves the checkout session server-side and persists
// the subscription. Makes the purchase flow work even when the Stripe webhook
// isn't configured (local dev) or its delivery fails.
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const sessionId = body?.sessionId
  if (!sessionId || typeof sessionId !== 'string' || !sessionId.startsWith('cs_')) {
    return NextResponse.json({ error: 'sessionId invalide' }, { status: 400 })
  }

  try {
    const checkout = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    })

    // The checkout session must belong to the signed-in user
    const ownerId = checkout.metadata?.userId || checkout.client_reference_id
    if (ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Session inconnue' }, { status: 403 })
    }
    if (checkout.payment_status !== 'paid' || !checkout.subscription) {
      return NextResponse.json({ error: 'Paiement non confirmé' }, { status: 409 })
    }

    const stripeSub =
      typeof checkout.subscription === 'string'
        ? await stripe.subscriptions.retrieve(checkout.subscription)
        : checkout.subscription

    const sub = await upsertSubscription(stripeSub, session.user.id)
    if (!sub) {
      return NextResponse.json({ error: 'Plan non reconnu' }, { status: 422 })
    }

    return NextResponse.json({
      ok: true,
      plan: sub.plan,
      slots: sub.slotsIncluded,
      status: sub.status,
    })
  } catch (err) {
    console.error('[stripe sync]', err)
    return NextResponse.json({ error: 'Erreur de synchronisation' }, { status: 500 })
  }
}
