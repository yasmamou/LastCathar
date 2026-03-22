import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/stats/track — track a place view
export async function POST(request: Request) {
  const { placeSlug } = await request.json()

  if (!placeSlug) {
    return NextResponse.json({ error: 'placeSlug requis' }, { status: 400 })
  }

  await prisma.placeView.create({
    data: { placeSlug, event: 'PLACE_OPEN' },
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
