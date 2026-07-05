'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Compass, Trophy, X, ChevronUp, LayoutGrid } from 'lucide-react'
import { useState } from 'react'
import type { GameState } from './useChercheur'
import { getEpic } from '@/lib/game'
import type { Epic, EpicPlace } from '@/data/epics'

interface Props {
  state: GameState | null
  activeEpicId: string
  onNextStep: () => void
  onOpenPicker: () => void
  onStop: () => void
  panelOpen?: boolean
}

export function ChercheurHUD({ state, activeEpicId, onNextStep, onOpenPicker, onStop, panelOpen }: Props) {
  const [mobileExpanded, setMobileExpanded] = useState(false)
  const epic = getEpic(activeEpicId)
  if (!epic) return null

  const progress = state?.progress.find((p) => p.epicId === activeEpicId)
  const visitedCount = progress?.visitedSlugs.length ?? 0
  const total = epic.places.length
  const ratio = Math.min(1, visitedCount / total)

  const orderedPlaces = [...epic.places].sort((a, b) => a.order - b.order)
  const nextStep = orderedPlaces.find((p) => !progress?.visitedSlugs.includes(p.slug))

  // Mobile: compact pill at bottom-left when no panel, hidden when panel is open (which is full-screen)
  // Desktop position:
  // - panel closed: right side BELOW the header (top-20) — avoids UserMenu overlap
  // - panel open: header is hidden, so we can go higher (top-4) on the left
  const desktopPositionClass = panelOpen ? 'md:top-4 md:left-4' : 'md:top-20 md:right-4'

  if (panelOpen) {
    // Mobile hidden (panel full-screen) + desktop full HUD
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
        className={`hidden md:block absolute ${desktopPositionClass} z-30 pointer-events-auto`}
      >
        <FullHudCard
          state={state}
          epic={epic}
          visitedCount={visitedCount}
          total={total}
          ratio={ratio}
          nextStep={nextStep}
          onNextStep={onNextStep}
          onOpenPicker={onOpenPicker}
          onStop={onStop}
        />
      </motion.div>
    )
  }

  return (
    <>
      {/* Mobile compact pill — bottom-left, above the featured strip */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.4 }}
        onClick={() => setMobileExpanded(true)}
        className="md:hidden absolute bottom-[6.5rem] left-2 z-30 pointer-events-auto glass rounded-full border border-amber-400/25 bg-black/50 backdrop-blur-md pl-2 pr-3 py-1.5 flex items-center gap-2 shadow-lg"
        aria-label="Ouvrir le HUD Chercheur"
      >
        <Compass className="w-3.5 h-3.5 text-amber-300" />
        {state && (
          <span className="text-[10px] text-white/80 font-medium">
            Nv <b className="text-amber-300">{state.level}</b>
          </span>
        )}
        <span className="text-[10px] text-white/50">·</span>
        <span className="text-[10px] text-white/80">
          <b>{visitedCount}</b>/{total}
        </span>
        <div className="w-8 h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${(ratio * 100).toFixed(0)}%`,
              background: `linear-gradient(90deg, ${epic.color}, #facc15)`,
            }}
          />
        </div>
      </motion.button>

      {/* Mobile expanded bottom-sheet */}
      <AnimatePresence>
        {mobileExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-40 flex items-end pointer-events-auto"
            style={{ background: 'rgba(5,6,13,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={() => setMobileExpanded(false)}
          >
            <motion.div
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded-t-2xl border-t border-amber-400/20 bg-gradient-to-b from-[#0f1120] to-[#05060d] p-4 pb-6"
            >
              <div className="flex justify-center mb-3">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
              <FullHudCard
                state={state}
                epic={epic}
                visitedCount={visitedCount}
                total={total}
                ratio={ratio}
                nextStep={nextStep}
                onNextStep={() => {
                  setMobileExpanded(false)
                  onNextStep()
                }}
                onOpenPicker={() => {
                  setMobileExpanded(false)
                  onOpenPicker()
                }}
                onStop={() => {
                  setMobileExpanded(false)
                  onStop()
                }}
                fullWidth
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop full HUD */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
        className={`hidden md:block absolute ${desktopPositionClass} z-30 pointer-events-auto`}
      >
        <FullHudCard
          state={state}
          epic={epic}
          visitedCount={visitedCount}
          total={total}
          ratio={ratio}
          nextStep={nextStep}
          onNextStep={onNextStep}
          onOpenPicker={onOpenPicker}
          onStop={onStop}
        />
      </motion.div>
    </>
  )
}

interface FullHudCardProps {
  state: GameState | null
  epic: Epic
  visitedCount: number
  total: number
  ratio: number
  nextStep: EpicPlace | undefined
  onNextStep: () => void
  onOpenPicker: () => void
  onStop: () => void
  fullWidth?: boolean
}

function FullHudCard({
  state,
  epic,
  visitedCount,
  total,
  ratio,
  nextStep,
  onNextStep,
  onOpenPicker,
  onStop,
  fullWidth,
}: FullHudCardProps) {
  if (!epic) return null
  return (
    <div
      className={`glass rounded-2xl border border-amber-400/20 bg-black/40 backdrop-blur-md px-4 py-3 shadow-lg ${
        fullWidth ? 'w-full' : 'min-w-[280px]'
      }`}
    >
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

      <button
        onClick={onOpenPicker}
        className="w-full flex items-center gap-2 mb-1.5 rounded hover:bg-white/5 transition-colors p-1 -mx-1 group/epic"
        title="Changer d'épopée"
      >
        <span className="text-base">{epic.icon}</span>
        <span className="text-xs text-white font-medium truncate flex-1 text-left">{epic.title}</span>
        <LayoutGrid className="w-3 h-3 text-white/40 group-hover/epic:text-amber-300 transition-colors flex-shrink-0" />
      </button>

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
          className="w-full text-left rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-amber-400/30 transition p-2 flex items-center gap-2"
        >
          <div className="flex-1 min-w-0">
            <div className="text-[9px] uppercase tracking-widest text-white/40">
              Prochaine étape {nextStep.date ? `— ${nextStep.date}` : ''}
            </div>
            <div className="text-xs text-white/90 mt-0.5 truncate">{nextStep.role}</div>
          </div>
          <ChevronUp className="w-3.5 h-3.5 text-amber-300 rotate-90 flex-shrink-0" />
        </button>
      ) : (
        <button
          onClick={onOpenPicker}
          className="w-full rounded-lg border border-amber-400/40 bg-amber-400/10 hover:bg-amber-400/15 transition p-2 text-center text-xs text-amber-300 flex items-center justify-center gap-1.5"
        >
          <LayoutGrid className="w-3 h-3" />
          Épopée terminée — choisir la suivante
        </button>
      )}
    </div>
  )
}
