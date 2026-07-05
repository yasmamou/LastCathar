import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }
  const { placeSlug, title, description, price, externalUrl, imageUrls } = body

  if (!placeSlug || typeof placeSlug !== 'string' || !title || typeof title !== 'string') {
    return NextResponse.json({ error: 'Le lieu et le titre sont requis' }, { status: 400 })
  }
  if (title.length > 120) {
    return NextResponse.json({ error: 'Titre trop long (120 caractères max)' }, { status: 400 })
  }
  const safeImageUrls = Array.isArray(imageUrls)
    ? imageUrls.filter((u): u is string => typeof u === 'string').slice(0, 5)
    : []

  // Normalize URL: add https:// if missing
  const rawUrl = typeof externalUrl === 'string' ? externalUrl.trim() : ''
  const normalizedUrl = rawUrl && !rawUrl.startsWith('http')
    ? 'https://' + rawUrl
    : rawUrl

  // ─── Enforce the paid model server-side ───
  // Previously any authenticated user could place a product for free (the only
  // barrier was manual moderation). Require an active subscription with a free
  // slot. Returns 402 with a machine-readable `code` so the client can route the
  // user to /pricing.
  const activeSubs = await prisma.subscription.findMany({
    where: { userId: session.user.id, status: 'ACTIVE' },
    select: { slotsIncluded: true },
  })
  const totalSlots = activeSubs.reduce((sum, s) => sum + s.slotsIncluded, 0)
  if (totalSlots === 0) {
    return NextResponse.json(
      { error: 'Un abonnement est requis pour publier un produit.', code: 'NO_SUBSCRIPTION' },
      { status: 402 },
    )
  }
  const usedSlots = await prisma.product.count({
    where: { sellerId: session.user.id, status: { in: ['APPROVED', 'REVIEW'] } },
  })
  if (usedSlots >= totalSlots) {
    return NextResponse.json(
      { error: 'Vous avez utilisé tous vos emplacements. Passez au pack supérieur.', code: 'NO_SLOTS' },
      { status: 402 },
    )
  }

  // Find or create the place slot
  const placeSlot =
    (await prisma.placeSlot.findUnique({ where: { placeSlug } })) ??
    (await prisma.placeSlot
      .create({ data: { placeSlug, maxSlots: 4, pricePerMonth: 50 } })
      // Concurrent first-submit on the same place can race the unique constraint;
      // fall back to the row the other request created.
      .catch(() => prisma.placeSlot.findUnique({ where: { placeSlug } })))

  if (!placeSlot) {
    return NextResponse.json({ error: 'Emplacement indisponible' }, { status: 409 })
  }

  // Count occupied slots and create atomically to avoid a TOCTOU where two
  // concurrent submits both pass the room check and overflow maxSlots.
  try {
    const product = await prisma.$transaction(async (tx) => {
      const occupied = await tx.product.count({
        where: { placeSlotId: placeSlot.id, status: { in: ['APPROVED', 'REVIEW'] } },
      })
      if (occupied >= placeSlot.maxSlots) {
        throw new Error('SLOT_FULL')
      }
      return tx.product.create({
        data: {
          sellerId: session.user.id,
          placeSlotId: placeSlot.id,
          title,
          description: typeof description === 'string' ? description : null,
          price: typeof price === 'string' ? price : null,
          externalUrl: normalizedUrl || null,
          imageUrls: safeImageUrls,
          status: 'REVIEW',
        },
      })
    })

    return NextResponse.json({
      id: product.id,
      status: product.status,
      message: 'Produit soumis et en attente de validation',
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'SLOT_FULL') {
      return NextResponse.json(
        { error: 'Tous les emplacements sont occupés pour ce lieu. Réessayez plus tard.' },
        { status: 409 },
      )
    }
    throw err
  }
}
