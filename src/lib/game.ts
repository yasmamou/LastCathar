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

const STATIC_BADGES: BadgeDef[] = [
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
    slug: 'explorer-50',
    label: 'Grand voyageur',
    description: '50 lieux visités.',
    icon: '🗺️',
    color: '#c084fc',
  },
  {
    slug: 'first-epic-complete',
    label: 'Chercheur accompli',
    description: 'Vous avez terminé votre première épopée.',
    icon: '🌟',
    color: '#facc15',
  },
  {
    slug: 'three-epics',
    label: 'Trois quêtes accomplies',
    description: 'Vous avez terminé 3 épopées.',
    icon: '🏆',
    color: '#eab308',
  },
  {
    slug: 'grand-chercheur',
    label: 'Grand Chercheur',
    description: 'Vous avez terminé les 16 épopées de Last Cathar.',
    icon: '👑',
    color: '#f59e0b',
  },
]

// Generic per-epic badges: "epic <id> started" (first place) + "epic <id> complete".
// Generated dynamically from EPICS so adding a new epic gives it badges for free.
const EPIC_BADGES: BadgeDef[] = EPICS.flatMap((e) => [
  {
    slug: `epic-${e.id}-started`,
    label: `${e.title} — Amorcée`,
    description: `Vous avez ouvert le premier lieu de l'épopée ${e.title}.`,
    icon: e.icon,
    color: e.color,
  },
  {
    slug: `epic-${e.id}-half`,
    label: `${e.title} — À mi-chemin`,
    description: `Vous avez parcouru la moitié de ${e.title}.`,
    icon: e.icon,
    color: e.color,
  },
  {
    slug: `epic-${e.id}-complete`,
    label: `${e.title} — Complétée`,
    description: `Vous avez visité tous les lieux de ${e.title}.`,
    icon: '👑',
    color: e.color,
  },
])

export const BADGES: BadgeDef[] = [...STATIC_BADGES, ...EPIC_BADGES]

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
  totalCompletedEpics: number
}): string[] {
  const earned: string[] = []
  const {
    epic,
    epicProgress,
    totalPlacesVisited,
    visitedSlug,
    isFirstEpicCompleted,
    totalCompletedEpics,
  } = input

  if (totalPlacesVisited >= 1) earned.push('first-step')
  if (totalPlacesVisited >= 10) earned.push('explorer-10')
  if (totalPlacesVisited >= 25) earned.push('explorer-25')
  if (totalPlacesVisited >= 50) earned.push('explorer-50')

  // Generic per-epic badges (started / half / complete)
  earned.push(`epic-${epic.id}-started`)
  const halfCount = Math.ceil(epic.places.length / 2)
  if (epicProgress.visitedSlugs.length >= halfCount) {
    earned.push(`epic-${epic.id}-half`)
  }
  if (epicProgress.completed) {
    earned.push(`epic-${epic.id}-complete`)
  }

  // Legacy Cathare badge kept for backwards-compat with users who earned it before
  if (epic.id === 'croisade-cathare' && visitedSlug === 'cite-de-carcassonne') {
    earned.push('cathare-carcassonne')
  }

  if (isFirstEpicCompleted) earned.push('first-epic-complete')
  if (totalCompletedEpics >= 3) earned.push('three-epics')
  if (totalCompletedEpics >= EPICS.length) earned.push('grand-chercheur')

  return earned
}

/**
 * Recommend the next epic for a chercheur based on their current progress.
 * Priority: any epic in progress (not complete) → any epic never started, in EPICS order.
 */
export function nextRecommendedEpic(input: {
  currentEpicId: string
  progressByEpic: Record<string, { visitedSlugs: string[]; completed: boolean }>
}): Epic | null {
  const { currentEpicId, progressByEpic } = input
  // In-progress but not complete (excluding current)
  const inProgress = EPICS.find(
    (e) =>
      e.id !== currentEpicId &&
      progressByEpic[e.id] &&
      progressByEpic[e.id].visitedSlugs.length > 0 &&
      !progressByEpic[e.id].completed,
  )
  if (inProgress) return inProgress
  // Untouched
  const untouched = EPICS.find((e) => !progressByEpic[e.id])
  return untouched ?? null
}

/**
 * The starting epic for new "chercheurs" — Cathare, first place = Carcassonne.
 */
export const STARTER_EPIC_ID = 'croisade-cathare'
export const STARTER_PLACE_SLUG = 'cite-de-carcassonne'

export function getEpic(epicId: string): Epic | undefined {
  return EPICS.find((e) => e.id === epicId)
}
