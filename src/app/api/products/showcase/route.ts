import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Read fresh from the DB on every request — otherwise Next.js prerenders this
// route at build time and newly approved products never appear in the showcase.
export const dynamic = 'force-dynamic'

// GET /api/products/showcase — returns all approved products with their placeSlug,
// so the client can sort them by proximity to the current camera position.
// Products from a "Pack Marchand" (PACK_10) seller are flagged `featured` and
// listed first — the advertised "placement mis en avant dans la sidebar".
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
          seller: {
            select: {
              subscriptions: {
                where: { status: 'ACTIVE' },
                select: { plan: true },
              },
            },
          },
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
      featured: p.seller?.subscriptions?.some((s) => s.plan === 'PACK_10') ?? false,
    })),
  )

  // Featured (Pack Marchand) products first, keeping recency order within groups.
  products.sort((a, b) => Number(b.featured) - Number(a.featured))

  return NextResponse.json({ products })
}
