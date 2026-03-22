import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/products/click — track product click + increment counter
export async function POST(request: Request) {
  const { productId, placeSlug } = await request.json()

  if (!productId) {
    return NextResponse.json({ error: 'Missing productId' }, { status: 400 })
  }

  // Increment click counter on product
  await prisma.product.update({
    where: { id: productId },
    data: { clicks: { increment: 1 } },
  }).catch(() => {})

  // Track analytics event
  await prisma.placeView.create({
    data: {
      placeSlug: placeSlug || '',
      productId,
      event: 'PRODUCT_CLICK',
    },
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
