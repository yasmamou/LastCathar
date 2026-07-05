import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { throttle, clientIp } from '@/lib/rate-limit'

// POST /api/products/click — track product click + increment counter
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const productId = body?.productId
  const placeSlug = body?.placeSlug

  if (!productId || typeof productId !== 'string') {
    return NextResponse.json({ error: 'Missing productId' }, { status: 400 })
  }

  // Only count clicks on a real product — prevents inflating the (billable)
  // click metric with fabricated ids.
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, placeSlot: { select: { placeSlug: true } } },
  })
  if (!product) {
    return NextResponse.json({ error: 'Produit inconnu' }, { status: 404 })
  }

  // Throttle repeat clicks from the same client on the same product.
  if (!throttle(`click:${clientIp(request)}:${productId}`, 5, 60_000)) {
    return NextResponse.json({ ok: true, throttled: true })
  }

  // Increment click counter on product
  await prisma.product.update({
    where: { id: productId },
    data: { clicks: { increment: 1 } },
  }).catch(() => {})

  // Track analytics event (trust the DB's placeSlug over the client-sent one)
  await prisma.placeView.create({
    data: {
      placeSlug: product.placeSlot?.placeSlug ?? (typeof placeSlug === 'string' ? placeSlug : ''),
      productId,
      event: 'PRODUCT_CLICK',
    },
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
