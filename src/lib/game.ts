import { EPICS, type Epic } from '@/data/epics'

export const XP_PER_EPIC_PLACE = 100
export const XP_PER_BONUS_PLACE = 30
export const XP_EPIC_COMPLETE = 500

const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 2000, 3500, 5500, 8000, 12000, 18000]

export function levelForXp(xp: number): number {
  let level = 1
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1
  }
  return level
}

export function xpToNextLevel(xp: number): { current: number; needed: number; ratio: number } {
  const level = levelForXp(xp)
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? currentThreshold + 5000
  const current = xp - currentThreshold
  const needed = nextThreshold - currentThreshold
  return { current, needed, ratio: Math.min(1, current / needed) }
}

export interface BadgeDef {
  slug: string
  label: string
  description: string
  icon: string
  color: string
  hidden?: boolean
}

export const BADGES: BadgeDef[] = [
  {
    slug: 'first-step',
    label: 'Premier pas',
    description: 'Vous avez ouvert votre premier lieu.',
    icon: '🏁',
    color: '#a3a3a3',
  },
  {
    slug: 'cathare-carcassonne',
    label: 'Sur les traces des Cathares',
    description: 'Vous avez commencé l\'épopée à Carcassonne — 1209.',
    icon: '🔥',
    color: '#ef4444',
  },
  {
    slug: 'cathare-half',
    label: 'Le sang du Midi',
    description: 'Vous avez parcouru la moitié de la Croisade Cathare.',
    icon: '⚔️',
    color: '#f97316',
  },
  {
    slug: 'cathare-complete',
    label: 'Gardien du Graal',
    description: 'Vous avez parcouru l\'intégralité de la Croisade Cathare — de Béziers à Rennes-le-Château.',
    icon: '👑',
    color: '#e2b650',
  },
  {
    slug: 'explorer-10',
    label: 'Explorateur',
    description: '10 lieux visités à travers le monde.',
    icon: '🧭',
    color: '#38bdf8',
  },
  {
    slug: 'explorer-25',
    label: 'Voyageur érudit',
    description: '25 lieux visités.',
    icon: '📜',
    color: '#a78bfa',
  },
  {
    slug: 'first-epic-complete',
    label: 'Chercheur accompli',
    description: 'Vous avez terminé votre première épopée.',
    icon: '🌟',
    color: '#facc15',
  },
]

export const BADGE_MAP = Object.fromEntries(BADGES.map((b) => [b.slug, b])) as Record<
  string,
  BadgeDef
>

/**
 * Given a user state after visiting a place, return the badge slugs newly earned.
 * Caller is responsible for filtering out already-earned badges.
 */
export function checkBadgesForVisit(input: {
  epic: Epic
  epicProgress: { visitedSlugs: string[]; completed: boolean }
  totalPlacesVisited: number
  visitedSlug: string
  isFirstEpicCompleted: boolean
}): string[] {
  const earned: string[] = []
  const { epic, epicProgress, totalPlacesVisited, visitedSlug, isFirstEpicCompleted } = input

  if (totalPlacesVisited >= 1) earned.push('first-step')
  if (totalPlacesVisited >= 10) earned.push('explorer-10')
  if (totalPlacesVisited >= 25) earned.push('explorer-25')

  if (epic.id === 'croisade-cathare') {
    if (visitedSlug === 'cite-de-carcassonne') earned.push('cathare-carcassonne')
    const halfCount = Math.ceil(epic.places.length / 2)
    if (epicProgress.visitedSlugs.length >= halfCount) earned.push('cathare-half')
    if (epicProgress.completed) earned.push('cathare-complete')
  }

  if (isFirstEpicCompleted) earned.push('first-epic-complete')

  return earned
}

/**
 * The starting epic for new "chercheurs" — Cathare, first place = Carcassonne.
 */
export const STARTER_EPIC_ID = 'croisade-cathare'
export const STARTER_PLACE_SLUG = 'cite-de-carcassonne'

export function getEpic(epicId: string): Epic | undefined {
  return EPICS.find((e) => e.id === epicId)
}
