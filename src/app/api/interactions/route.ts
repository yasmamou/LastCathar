import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ interactions: [] })
  }

  const interactions = await prisma.userPlaceInteraction.findMany({
    where: { userId: session.user.id },
    select: { placeSlug: true, type: true },
  })

  return NextResponse.json({ interactions })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const placeSlug = body?.placeSlug
  const type = body?.type

  if (!placeSlug || !type) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  const validTypes = ['VISITED', 'WISHLIST', 'FAVORITE']
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: 'Type invalide' }, { status: 400 })
  }

  // Toggle: if exists, remove it; if not, create it
  const existing = await prisma.userPlaceInteraction.findUnique({
    where: {
      userId_placeSlug_type: {
        userId: session.user.id,
        placeSlug,
        type,
      },
    },
  })

  if (existing) {
    await prisma.userPlaceInteraction.delete({ where: { id: existing.id } })
    return NextResponse.json({ action: 'removed', placeSlug, type })
  }

  try {
    await prisma.userPlaceInteraction.create({
      data: {
        userId: session.user.id,
        placeSlug,
        type,
      },
    })
  } catch {
    // Concurrent double-click can race past the findUnique above and hit the
    // unique constraint (P2002) — treat it as already added rather than a 500.
    return NextResponse.json({ action: 'added', placeSlug, type })
  }

  return NextResponse.json({ action: 'added', placeSlug, type })
}
