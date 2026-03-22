import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/stats?placeSlug=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const placeSlug = searchParams.get('placeSlug')

  if (!placeSlug) {
    return NextResponse.json({ error: 'placeSlug requis' }, { status: 400 })
  }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [totalViews, todayViews, totalProductClicks, todayProductClicks] = await Promise.all([
    // Total place views
    prisma.placeView.count({
      where: { placeSlug, event: 'PLACE_OPEN' },
    }),
    // Today's place views
    prisma.placeView.count({
      where: { placeSlug, event: 'PLACE_OPEN', createdAt: { gte: todayStart } },
    }),
    // Total product clicks on this place
    prisma.placeView.count({
      where: { placeSlug, event: 'PRODUCT_CLICK' },
    }),
    // Today product clicks
    prisma.placeView.count({
      where: { placeSlug, event: 'PRODUCT_CLICK', createdAt: { gte: todayStart } },
    }),
  ])

  return NextResponse.json({
    totalViews,
    todayViews,
    totalProductClicks,
    todayProductClicks,
  })
}
