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

  // NOTE: view tracking lives in POST /api/stats/track (fired once by the panel).
  // Counting it here too double-counted every place open in the merchant-facing stats.

  // Occupied slots must match the submit endpoint's rule (APPROVED + REVIEW),
  // otherwise the UI shows a free slot that the POST then rejects with a 409.
  const occupied = await prisma.product.count({
    where: { placeSlotId: placeSlot.id, status: { in: ['APPROVED', 'REVIEW'] } },
  })

  return NextResponse.json({
    products: placeSlot.products,
    maxSlots: placeSlot.maxSlots,
    availableSlots: Math.max(0, placeSlot.maxSlots - occupied),
    pricePerMonth: placeSlot.pricePerMonth,
  })
}
