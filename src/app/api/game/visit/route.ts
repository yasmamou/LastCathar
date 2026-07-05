import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  XP_PER_EPIC_PLACE,
  XP_PER_BONUS_PLACE,
  XP_EPIC_COMPLETE,
  checkBadgesForVisit,
  getEpic,
  levelForXp,
  xpToNextLevel,
} from '@/lib/game'
import { VALID_PLACE_SLUGS } from '@/lib/valid-slugs'

// Pseudo-epic id under which off-epic ("bonus") visits are tracked in
// UserEpicProgress. Not part of EPICS, so it never shows in the picker.
const BONUS_EPIC_ID = 'bonus'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as { epicId?: string; placeSlug?: string } | null
  const epicId = body?.epicId
  const placeSlug = body?.placeSlug
  if (!epicId || !placeSlug) {
    return NextResponse.json({ error: 'epicId et placeSlug requis' }, { status: 400 })
  }

  // Off-epic exploration: award a smaller XP bonus, once per distinct place.
  if (epicId === BONUS_EPIC_ID) {
    return handleBonusVisit(session.user.id, placeSlug)
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

  // Atomic increment avoids a read-modify-write race when two visits land
  // concurrently (double-click / two tabs) and one overwrites the other.
  let newXp = xpRow.xp
  let newLevel = levelForXp(newXp)
  if (awardedXp > 0) {
    const updated = await prisma.userXP.update({
      where: { userId },
      data: { xp: { increment: awardedXp } },
    })
    newXp = updated.xp
    newLevel = levelForXp(newXp)
    if (updated.level !== newLevel) {
      await prisma.userXP.update({ where: { userId }, data: { level: newLevel } })
    }
  }

  // Badges
  const [interactions, allProgress, existingBadges] = await Promise.all([
    prisma.userPlaceInteraction.findMany({
      where: { userId, type: 'VISITED' },
      select: { placeSlug: true },
    }),
    prisma.userEpicProgress.findMany({
      where: { userId },
      select: { visitedSlugs: true, completedAt: true },
    }),
    prisma.userBadge.findMany({ where: { userId } }),
  ])

  const completedEpicsCount = allProgress.filter((p) => p.completedAt !== null).length

  // Explorer badges count DISTINCT places across every epic + manual "Visité"
  // marks — counting only the current epic undercounted multi-epic chercheurs.
  const distinctVisited = new Set<string>(interactions.map((i) => i.placeSlug))
  for (const p of allProgress) for (const s of p.visitedSlugs) distinctVisited.add(s)
  for (const s of visitedSlugs) distinctVisited.add(s)

  const isFirstEpicCompleted = completed && !wasCompleted && completedEpicsCount <= 1

  const candidates = checkBadgesForVisit({
    epic,
    epicProgress: { visitedSlugs: progress.visitedSlugs, completed },
    totalPlacesVisited: distinctVisited.size,
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

// Off-epic visit: +XP_PER_BONUS_PLACE once per distinct place, tracked in the
// 'bonus' pseudo-epic row. Explorer badges (10/25/50 lieux) still apply.
async function handleBonusVisit(userId: string, placeSlug: string) {
  if (!VALID_PLACE_SLUGS.has(placeSlug)) {
    return NextResponse.json({ error: 'Lieu inconnu' }, { status: 400 })
  }

  const xpRow = await prisma.userXP.upsert({
    where: { userId },
    create: { userId, xp: 0, level: 1 },
    update: {},
  })

  const existing = await prisma.userEpicProgress.findUnique({
    where: { userId_epicId: { userId, epicId: BONUS_EPIC_ID } },
  })
  const alreadyVisited = existing?.visitedSlugs.includes(placeSlug) ?? false
  const visitedSlugs = alreadyVisited
    ? existing!.visitedSlugs
    : [...(existing?.visitedSlugs ?? []), placeSlug]

  if (!alreadyVisited) {
    await prisma.userEpicProgress.upsert({
      where: { userId_epicId: { userId, epicId: BONUS_EPIC_ID } },
      create: { userId, epicId: BONUS_EPIC_ID, currentOrder: 0, visitedSlugs, completedAt: null },
      update: { visitedSlugs },
    })
  }

  const awardedXp = alreadyVisited ? 0 : XP_PER_BONUS_PLACE
  let newXp = xpRow.xp
  let newLevel = levelForXp(newXp)
  if (awardedXp > 0) {
    const updated = await prisma.userXP.update({
      where: { userId },
      data: { xp: { increment: awardedXp } },
    })
    newXp = updated.xp
    newLevel = levelForXp(newXp)
    if (updated.level !== newLevel) {
      await prisma.userXP.update({ where: { userId }, data: { level: newLevel } })
    }
  }

  // Explorer badges on distinct visited places (all epics + manual marks)
  const [interactions, allProgress, existingBadges] = await Promise.all([
    prisma.userPlaceInteraction.findMany({
      where: { userId, type: 'VISITED' },
      select: { placeSlug: true },
    }),
    prisma.userEpicProgress.findMany({ where: { userId }, select: { visitedSlugs: true } }),
    prisma.userBadge.findMany({ where: { userId } }),
  ])
  const distinctVisited = new Set<string>(interactions.map((i) => i.placeSlug))
  for (const p of allProgress) for (const s of p.visitedSlugs) distinctVisited.add(s)
  for (const s of visitedSlugs) distinctVisited.add(s)

  const candidates: string[] = []
  if (distinctVisited.size >= 1) candidates.push('first-step')
  if (distinctVisited.size >= 10) candidates.push('explorer-10')
  if (distinctVisited.size >= 25) candidates.push('explorer-25')
  if (distinctVisited.size >= 50) candidates.push('explorer-50')

  const alreadyBadgeSlugs = new Set(existingBadges.map((b) => b.badgeSlug))
  const newBadges = candidates.filter((s) => !alreadyBadgeSlugs.has(s))
  if (newBadges.length > 0) {
    await prisma.userBadge.createMany({
      data: newBadges.map((slug) => ({ userId, badgeSlug: slug })),
      skipDuplicates: true,
    })
  }

  return NextResponse.json({
    awardedXp,
    xp: newXp,
    level: newLevel,
    nextLevel: xpToNextLevel(newXp),
    newBadges,
    progress: {
      epicId: BONUS_EPIC_ID,
      currentOrder: 0,
      visitedSlugs,
      completed: false,
    },
  })
}
