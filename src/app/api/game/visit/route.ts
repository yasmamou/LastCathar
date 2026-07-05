import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  XP_PER_EPIC_PLACE,
  XP_EPIC_COMPLETE,
  checkBadgesForVisit,
  getEpic,
  levelForXp,
  xpToNextLevel,
} from '@/lib/game'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  }

  const { epicId, placeSlug } = (await request.json()) as { epicId: string; placeSlug: string }
  if (!epicId || !placeSlug) {
    return NextResponse.json({ error: 'epicId et placeSlug requis' }, { status: 400 })
  }

  const epic = getEpic(epicId)
  if (!epic) return NextResponse.json({ error: 'Épopée inconnue' }, { status: 404 })

  const epicPlace = epic.places.find((p) => p.slug === placeSlug)
  if (!epicPlace) {
    return NextResponse.json({ error: "Ce lieu ne fait pas partie de l'épopée" }, { status: 400 })
  }

  const userId = session.user.id

  // Ensure XP row
  const xpRow = await prisma.userXP.upsert({
    where: { userId },
    create: { userId, xp: 0, level: 1 },
    update: {},
  })

  // Current progress
  const existing = await prisma.userEpicProgress.findUnique({
    where: { userId_epicId: { userId, epicId } },
  })
  const alreadyVisited = existing?.visitedSlugs.includes(placeSlug) ?? false

  const visitedSlugs = alreadyVisited
    ? existing!.visitedSlugs
    : [...(existing?.visitedSlugs ?? []), placeSlug]

  // Advance currentOrder if we've now visited every place up to and including some order
  const orderedSlugs = [...epic.places].sort((a, b) => a.order - b.order).map((p) => p.slug)
  let currentOrder = 1
  for (const slug of orderedSlugs) {
    if (visitedSlugs.includes(slug)) currentOrder = (epic.places.find((p) => p.slug === slug)?.order ?? currentOrder) + 1
    else break
  }
  const completed = visitedSlugs.length >= epic.places.length
  const wasCompleted = !!existing?.completedAt

  const progress = await prisma.userEpicProgress.upsert({
    where: { userId_epicId: { userId, epicId } },
    create: {
      userId,
      epicId,
      currentOrder,
      visitedSlugs,
      completedAt: completed ? new Date() : null,
    },
    update: {
      currentOrder,
      visitedSlugs,
      completedAt: completed && !wasCompleted ? new Date() : existing?.completedAt,
    },
  })

  // Award XP only for new visits
  let awardedXp = 0
  if (!alreadyVisited) {
    awardedXp += XP_PER_EPIC_PLACE
    if (completed && !wasCompleted) awardedXp += XP_EPIC_COMPLETE
  }

  const newXp = xpRow.xp + awardedXp
  const newLevel = levelForXp(newXp)
  await prisma.userXP.update({
    where: { userId },
    data: { xp: newXp, level: newLevel },
  })

  // Badges
  const [totalInteractions, completedEpicsCount, existingBadges] = await Promise.all([
    prisma.userPlaceInteraction.count({ where: { userId, type: 'VISITED' } }),
    prisma.userEpicProgress.count({ where: { userId, completedAt: { not: null } } }),
    prisma.userBadge.findMany({ where: { userId } }),
  ])

  const isFirstEpicCompleted = completed && !wasCompleted && completedEpicsCount <= 1

  const candidates = checkBadgesForVisit({
    epic,
    epicProgress: { visitedSlugs: progress.visitedSlugs, completed },
    totalPlacesVisited: Math.max(totalInteractions, visitedSlugs.length),
    visitedSlug: placeSlug,
    isFirstEpicCompleted,
    totalCompletedEpics: completedEpicsCount,
  })

  const alreadyBadgeSlugs = new Set(existingBadges.map((b) => b.badgeSlug))
  const newBadges = candidates.filter((s) => !alreadyBadgeSlugs.has(s))

  if (newBadges.length > 0) {
    await prisma.userBadge.createMany({
      data: newBadges.map((slug) => ({ userId, badgeSlug: slug })),
      skipDuplicates: true,
    })
  }

  const nextLevel = xpToNextLevel(newXp)

  return NextResponse.json({
    awardedXp,
    xp: newXp,
    level: newLevel,
    nextLevel,
    newBadges,
    progress: {
      epicId,
      currentOrder,
      visitedSlugs,
      completed,
    },
  })
}
