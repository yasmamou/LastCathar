import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GRANTABLE_BADGES, BADGE_MAP } from '@/lib/game'

// POST /api/game/badge { badgeSlug } — grant a directly-grantable badge
// (allowlist) to the signed-in user. Idempotent. Used at the end of the
// immersive Carcassonne tour.
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const badgeSlug = body?.badgeSlug
  if (!badgeSlug || typeof badgeSlug !== 'string' || !GRANTABLE_BADGES.has(badgeSlug)) {
    return NextResponse.json({ error: 'Badge non attribuable' }, { status: 400 })
  }

  const existing = await prisma.userBadge.findFirst({
    where: { userId: session.user.id, badgeSlug },
  })
  const isNew = !existing
  if (isNew) {
    await prisma.userBadge.create({
      data: { userId: session.user.id, badgeSlug },
    }).catch(() => {})
  }

  return NextResponse.json({
    ok: true,
    isNew,
    badge: { ...(BADGE_MAP[badgeSlug] ?? {}), slug: badgeSlug },
  })
}
