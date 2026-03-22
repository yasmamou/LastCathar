import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  }

  const { placeSlug, title, description, price, externalUrl, imageUrls } = await request.json()

  if (!placeSlug || !title) {
    return NextResponse.json({ error: 'Le lieu et le titre sont requis' }, { status: 400 })
  }

  // Find or create the place slot
  let placeSlot = await prisma.placeSlot.findUnique({
    where: { placeSlug },
    include: { products: true },
  })

  if (!placeSlot) {
    // Create a default slot for this place (4 slots, 50€/month)
    placeSlot = await prisma.placeSlot.create({
      data: { placeSlug, maxSlots: 4, pricePerMonth: 50 },
      include: { products: true },
    })
  }

  // Check if there's room
  const approvedCount = placeSlot.products.filter(
    p => p.status === 'APPROVED' || p.status === 'REVIEW'
  ).length
  if (approvedCount >= placeSlot.maxSlots) {
    return NextResponse.json(
      { error: 'Tous les emplacements sont occupés pour ce lieu. Réessayez plus tard.' },
      { status: 409 }
    )
  }

  // Upgrade user to SELLER if they weren't already
  await prisma.user.update({
    where: { id: session.user.id },
    data: { role: 'SELLER' },
  }).catch(() => {})

  // Create the product in REVIEW status
  const product = await prisma.product.create({
    data: {
      sellerId: session.user.id,
      placeSlotId: placeSlot.id,
      title,
      description: description || null,
      price: price || null,
      externalUrl: externalUrl || null,
      imageUrls: imageUrls || [],
      status: 'REVIEW',
    },
  })

  return NextResponse.json({
    id: product.id,
    status: product.status,
    message: 'Produit soumis et en attente de validation',
  })
}
