import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { levelForXp, xpToNextLevel, BADGE_MAP } from '@/lib/game'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ authenticated: false })
  }

  const [xpRow, badges, progress] = await Promise.all([
    prisma.userXP.findUnique({ where: { userId: session.user.id } }),
    prisma.userBadge.findMany({ where: { userId: session.user.id } }),
    prisma.userEpicProgress.findMany({ where: { userId: session.user.id } }),
  ])

  const xp = xpRow?.xp ?? 0
  const level = levelForXp(xp)
  const nextLevel = xpToNextLevel(xp)

  return NextResponse.json({
    authenticated: true,
    xp,
    level,
    nextLevel,
    badges: badges.map((b) => ({
      ...(BADGE_MAP[b.badgeSlug] ?? {}),
      slug: b.badgeSlug,
      earnedAt: b.earnedAt,
    })),
    progress: progress.map((p) => ({
      epicId: p.epicId,
      currentOrder: p.currentOrder,
      visitedSlugs: p.visitedSlugs,
      completedAt: p.completedAt,
    })),
  })
}
