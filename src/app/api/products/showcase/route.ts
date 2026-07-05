import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Read fresh from the DB on every request — otherwise Next.js prerenders this
// route at build time and newly approved products never appear in the showcase.
export const dynamic = 'force-dynamic'

// GET /api/products/showcase — returns all approved products with their placeSlug,
// so the client can sort them by proximity to the current camera position.
export async function GET() {
  const slots = await prisma.placeSlot.findMany({
    include: {
      products: {
        where: { status: 'APPROVED' },
        select: {
          id: true,
          title: true,
          price: true,
          imageUrls: true,
          externalUrl: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  const products = slots.flatMap((slot) =>
    slot.products.map((p) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      thumbnail: p.imageUrls?.[0] ?? null,
      externalUrl: p.externalUrl,
      placeSlug: slot.placeSlug,
    })),
  )

  return NextResponse.json({ products })
}
