import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/products — list all products for moderation
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  }

  // Check admin role
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const products = await prisma.product.findMany({
    orderBy: [
      { status: 'asc' }, // REVIEW first
      { createdAt: 'desc' },
    ],
    include: {
      seller: { select: { name: true, email: true } },
      placeSlot: { select: { placeSlug: true } },
    },
  })

  return NextResponse.json({ products })
}

// PATCH /api/admin/products — approve or reject a product
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { productId, status } = await request.json()

  if (!productId || !['APPROVED', 'REJECTED'].includes(status)) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
  }

  const product = await prisma.product.update({
    where: { id: productId },
    data: { status },
  })

  return NextResponse.json({ id: product.id, status: product.status })
}
