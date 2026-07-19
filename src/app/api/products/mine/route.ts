import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PLAN_INFO, type PlanKey } from '@/lib/plans'

export const dynamic = 'force-dynamic'

// GET /api/products/mine — the signed-in seller's own products (all statuses)
// plus a summary of their subscription / slot usage. Powers the merchant space.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  }
  const userId = session.user.id

  const [products, activeSubs, anySub] = await Promise.all([
    prisma.product.findMany({
      where: { sellerId: userId, status: { not: 'ARCHIVED' } },
      orderBy: { createdAt: 'desc' },
      include: { placeSlot: { select: { placeSlug: true } } },
    }),
    prisma.subscription.findMany({
      where: { userId, status: 'ACTIVE' },
      select: { plan: true, slotsIncluded: true, currentPeriodEnd: true },
    }),
    prisma.subscription.findFirst({
      where: { userId, stripeCustomerId: { not: null } },
      select: { id: true },
    }),
  ])

  const totalSlots = activeSubs.reduce((sum, s) => sum + s.slotsIncluded, 0)
  // Occupied slots = products that hold a slot (approved or in review).
  const usedSlots = products.filter((p) => p.status === 'APPROVED' || p.status === 'REVIEW').length
  const plans = activeSubs.map((s) => PLAN_INFO[s.plan as PlanKey]?.name ?? s.plan)

  return NextResponse.json({
    subscription: {
      active: totalSlots > 0,
      totalSlots,
      usedSlots,
      plans,
      renewsAt: activeSubs[0]?.currentPeriodEnd ?? null,
      canManage: !!anySub, // has a Stripe customer → billing portal available
    },
    products: products.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      price: p.price,
      externalUrl: p.externalUrl,
      imageUrls: p.imageUrls,
      latitude: p.latitude,
      longitude: p.longitude,
      status: p.status,
      views: p.views,
      clicks: p.clicks,
      placeSlug: p.placeSlot.placeSlug,
      createdAt: p.createdAt,
    })),
  })
}
