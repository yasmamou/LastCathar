import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Seller-scoped product management. A seller may edit or delete ONLY their own
// products. (Admin approve/reject lives in /api/admin/products.)

async function ownProduct(userId: string, id: string) {
  const product = await prisma.product.findUnique({ where: { id }, select: { id: true, sellerId: true, status: true } })
  if (!product || product.sellerId !== userId) return null
  return product
}

// PATCH /api/products/[id] — edit a product's content.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  const existing = await ownProduct(session.user.id, params.id)
  if (!existing) return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }
  const { title, description, price, externalUrl, imageUrls, latitude, longitude } = body

  if (title !== undefined && (typeof title !== 'string' || !title.trim() || title.length > 120)) {
    return NextResponse.json({ error: 'Titre invalide (1–120 caractères)' }, { status: 400 })
  }

  const rawUrl = typeof externalUrl === 'string' ? externalUrl.trim() : undefined
  const normalizedUrl = rawUrl === undefined ? undefined : rawUrl && !rawUrl.startsWith('http') ? 'https://' + rawUrl : rawUrl

  const lat = typeof latitude === 'number' && Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 ? latitude : null
  const lng = typeof longitude === 'number' && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180 ? longitude : null

  const data: Record<string, unknown> = {}
  if (title !== undefined) data.title = title.trim()
  if (description !== undefined) data.description = typeof description === 'string' ? description : null
  if (price !== undefined) data.price = typeof price === 'string' ? price : null
  if (normalizedUrl !== undefined) data.externalUrl = normalizedUrl || null
  if (imageUrls !== undefined) {
    data.imageUrls = Array.isArray(imageUrls) ? imageUrls.filter((u): u is string => typeof u === 'string').slice(0, 5) : []
  }
  if (latitude !== undefined) data.latitude = lat
  if (longitude !== undefined) data.longitude = lng

  // A previously rejected product goes back to review after an edit so it can be
  // re-approved. Approved products stay live (edits are instant — as advertised).
  if (existing.status === 'REJECTED') data.status = 'REVIEW'

  const product = await prisma.product.update({ where: { id: params.id }, data })
  return NextResponse.json({ id: product.id, status: product.status })
}

// DELETE /api/products/[id] — remove a product (frees the slot).
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  const existing = await ownProduct(session.user.id, params.id)
  if (!existing) return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 })

  await prisma.product.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
