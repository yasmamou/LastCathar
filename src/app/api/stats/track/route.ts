import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { VALID_PLACE_SLUGS } from '@/lib/valid-slugs'
import { throttle, clientIp } from '@/lib/rate-limit'

// POST /api/stats/track — track a place view
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const placeSlug = body?.placeSlug

  if (!placeSlug || typeof placeSlug !== 'string') {
    return NextResponse.json({ error: 'placeSlug requis' }, { status: 400 })
  }

  // Reject fabricated slugs so they can't pollute the (merchant-facing) metrics.
  if (!VALID_PLACE_SLUGS.has(placeSlug)) {
    return NextResponse.json({ error: 'Lieu inconnu' }, { status: 400 })
  }

  // Throttle repeat views from the same client for the same place. Silently
  // accept (200) so a throttled client sees no error, but skip the write.
  if (!throttle(`view:${clientIp(request)}:${placeSlug}`, 5, 60_000)) {
    return NextResponse.json({ ok: true, throttled: true })
  }

  await prisma.placeView.create({
    data: { placeSlug, event: 'PLACE_OPEN' },
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
