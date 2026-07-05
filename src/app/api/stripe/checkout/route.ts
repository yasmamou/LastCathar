import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe, PLANS, type PlanKey } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as { plan?: PlanKey } | null
  const plan = body?.plan
  if (!plan || !PLANS[plan] || !PLANS[plan].priceId) {
    return NextResponse.json({ error: 'Plan inconnu ou non configuré' }, { status: 400 })
  }
  const planConfig = PLANS[plan]

  const origin = request.headers.get('origin') ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

  const existing = await prisma.subscription.findFirst({
    where: { userId: session.user.id, stripeCustomerId: { not: null } },
    orderBy: { updatedAt: 'desc' },
  })

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: planConfig.priceId, quantity: 1 }],
    customer: existing?.stripeCustomerId ?? undefined,
    customer_email: existing?.stripeCustomerId ? undefined : session.user.email,
    client_reference_id: session.user.id,
    metadata: {
      userId: session.user.id,
      plan,
    },
    subscription_data: {
      metadata: {
        userId: session.user.id,
        plan,
      },
    },
    success_url: `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing/canceled`,
    allow_promotion_codes: true,
  })

  return NextResponse.json({ url: checkoutSession.url })
}
