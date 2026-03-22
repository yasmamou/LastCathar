import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/products?placeSlug=carcassonne
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const placeSlug = searchParams.get('placeSlug')

  if (!placeSlug) {
    return NextResponse.json({ products: [] })
  }

  // Find the slot for this place
  const placeSlot = await prisma.placeSlot.findUnique({
    where: { placeSlug },
    include: {
      products: {
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!placeSlot) {
    return NextResponse.json({ products: [], maxSlots: 0, availableSlots: 0 })
  }

  // Track place view for analytics
  await prisma.placeView.create({
    data: { placeSlug, event: 'PLACE_OPEN' },
  }).catch(() => {}) // non-blocking

  return NextResponse.json({
    products: placeSlot.products,
    maxSlots: placeSlot.maxSlots,
    availableSlots: placeSlot.maxSlots - placeSlot.products.length,
    pricePerMonth: placeSlot.pricePerMonth,
  })
}
