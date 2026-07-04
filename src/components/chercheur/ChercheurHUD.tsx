'use client'

import { motion } from 'framer-motion'
import { Compass, Trophy, X } from 'lucide-react'
import type { GameState } from './useChercheur'
import { getEpic } from '@/lib/game'

interface Props {
  state: GameState | null
  activeEpicId: string
  onNextStep: () => void
  onStop: () => void
  panelOpen?: boolean
}

export function ChercheurHUD({ state, activeEpicId, onNextStep, onStop, panelOpen }: Props) {
  const epic = getEpic(activeEpicId)
  if (!epic) return null

  const progress = state?.progress.find((p) => p.epicId === activeEpicId)
  const visitedCount = progress?.visitedSlugs.length ?? 0
  const total = epic.places.length
  const ratio = Math.min(1, visitedCount / total)

  const orderedPlaces = [...epic.places].sort((a, b) => a.order - b.order)
  const nextStep = orderedPlaces.find((p) => !progress?.visitedSlugs.includes(p.slug))

  // When a panel is open (right-side sidebar on desktop, full-screen on mobile):
  // - Mobile: hide (panel takes whole screen)
  // - Desktop: shift to the left so it doesn't collide with the panel
  const positionClass = panelOpen
    ? 'hidden md:block md:top-4 md:left-4'
    : 'top-2 right-2 md:top-4 md:right-4'

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className={`absolute ${positionClass} z-30 pointer-events-auto`}
    >
      <div className="glass rounded-2xl border border-amber-400/20 bg-black/40 backdrop-blur-md px-3 py-2 md:px-4 md:py-3 shadow-lg min-w-[220px] md:min-w-[280px]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-[10px] uppercase tracking-widest text-amber-300 font-semibold">
              Mode Chercheur
            </span>
          </div>
          <button
            onClick={onStop}
            className="text-white/30 hover:text-white/70 transition"
            aria-label="Quitter le mode"
            title="Quitter le mode Chercheur"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {state && (
          <div className="mb-2 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-white/70">
              <Trophy className="w-3 h-3 text-amber-300" />
              <span>
                Niveau <b className="text-amber-300">{state.level}</b>
              </span>
            </div>
            <span className="text-white/50">{state.xp} XP</span>
          </div>
        )}

        {state && (
          <div className="h-1 rounded-full bg-white/10 overflow-hidden mb-2">
            <div
              className="h-full bg-amber-300 transition-all duration-500"
              style={{ width: `${(state.nextLevel.ratio * 100).toFixed(0)}%` }}
            />
          </div>
        )}

        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-base">{epic.icon}</span>
          <span className="text-xs text-white font-medium truncate">{epic.title}</span>
        </div>

        <div className="flex items-center justify-between mb-1 text-[10px] text-white/50">
          <span>Progression</span>
          <span>
            {visitedCount} / {total}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(ratio * 100).toFixed(0)}%`,
              background: `linear-gradient(90deg, ${epic.color}, #facc15)`,
            }}
          />
        </div>

        {nextStep ? (
          <button
            onClick={onNextStep}
            className="w-full text-left rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-amber-400/30 transition p-2"
          >
            <div className="text-[9px] uppercase tracking-widest text-white/40">
              Prochaine étape {nextStep.date ? `— ${nextStep.date}` : ''}
            </div>
            <div className="text-xs text-white/90 mt-0.5 truncate">{nextStep.role}</div>
          </button>
        ) : (
          <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-2 text-center text-xs text-amber-300">
            Épopée terminée — bravo, chercheur !
          </div>
        )}
      </div>
    </motion.div>
  )
}
