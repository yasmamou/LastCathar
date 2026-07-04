'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { STARTER_EPIC_ID } from '@/lib/game'

const LS_MODAL_SHOWN = 'chercheur:welcome-shown'
const LS_ACTIVE_MODE = 'chercheur:active'
const LS_ACTIVE_EPIC = 'chercheur:epic'

export interface GameState {
  xp: number
  level: number
  nextLevel: { current: number; needed: number; ratio: number }
  badges: Array<{ slug: string; label?: string; icon?: string; color?: string; earnedAt: string }>
  progress: Array<{ epicId: string; currentOrder: number; visitedSlugs: string[]; completedAt: string | null }>
}

export interface VisitResult {
  awardedXp: number
  xp: number
  level: number
  nextLevel: { current: number; needed: number; ratio: number }
  newBadges: string[]
  progress: { epicId: string; currentOrder: number; visitedSlugs: string[]; completed: boolean }
}

export function useChercheur() {
  const { status } = useSession()
  const [chercheurMode, setChercheurMode] = useState(false)
  const [activeEpicId, setActiveEpicId] = useState<string>(STARTER_EPIC_ID)
  const [showWelcome, setShowWelcome] = useState(false)
  const [state, setState] = useState<GameState | null>(null)
  const [lastBadges, setLastBadges] = useState<string[]>([])
  const [lastXpDelta, setLastXpDelta] = useState<number>(0)

  // Load persisted mode + auto-show welcome on first visit (unauthenticated OK too — teaser)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const alreadyShown = localStorage.getItem(LS_MODAL_SHOWN)
    const persistedMode = localStorage.getItem(LS_ACTIVE_MODE) === 'true'
    const persistedEpic = localStorage.getItem(LS_ACTIVE_EPIC)
    if (persistedEpic) setActiveEpicId(persistedEpic)
    if (persistedMode) setChercheurMode(true)
    if (!alreadyShown && !persistedMode) {
      const timer = setTimeout(() => setShowWelcome(true), 4200)
      return () => clearTimeout(timer)
    }
  }, [])

  // Fetch game state when authenticated
  const refresh = useCallback(async () => {
    if (status !== 'authenticated') {
      setState(null)
      return
    }
    try {
      const res = await fetch('/api/game/state')
      const data = await res.json()
      if (data.authenticated) {
        setState({
          xp: data.xp,
          level: data.level,
          nextLevel: data.nextLevel,
          badges: data.badges,
          progress: data.progress,
        })
      }
    } catch {
      // silent — not critical
    }
  }, [status])

  useEffect(() => {
    refresh()
  }, [refresh])

  const startMode = useCallback((epicId: string = STARTER_EPIC_ID) => {
    setChercheurMode(true)
    setActiveEpicId(epicId)
    setShowWelcome(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem(LS_MODAL_SHOWN, '1')
      localStorage.setItem(LS_ACTIVE_MODE, 'true')
      localStorage.setItem(LS_ACTIVE_EPIC, epicId)
    }
  }, [])

  const stopMode = useCallback(() => {
    setChercheurMode(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem(LS_ACTIVE_MODE, 'false')
    }
  }, [])

  const dismissWelcome = useCallback(() => {
    setShowWelcome(false)
    if (typeof window !== 'undefined') localStorage.setItem(LS_MODAL_SHOWN, '1')
  }, [])

  const recordVisit = useCallback(
    async (epicId: string, placeSlug: string): Promise<VisitResult | null> => {
      if (status !== 'authenticated') return null
      try {
        const res = await fetch('/api/game/visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ epicId, placeSlug }),
        })
        if (!res.ok) return null
        const data = (await res.json()) as VisitResult
        if (data.awardedXp > 0) setLastXpDelta(data.awardedXp)
        if (data.newBadges.length > 0) setLastBadges(data.newBadges)
        await refresh()
        return data
      } catch {
        return null
      }
    },
    [status, refresh],
  )

  const clearBadges = useCallback(() => setLastBadges([]), [])
  const clearXpDelta = useCallback(() => setLastXpDelta(0), [])

  return {
    chercheurMode,
    activeEpicId,
    showWelcome,
    state,
    lastBadges,
    lastXpDelta,
    startMode,
    stopMode,
    dismissWelcome,
    recordVisit,
    clearBadges,
    clearXpDelta,
    setActiveEpicId,
  }
}
