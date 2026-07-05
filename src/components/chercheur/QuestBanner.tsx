'use client'

import { motion } from 'framer-motion'
import { Flame, Sparkles, ChevronRight } from 'lucide-react'
import { getEpic, STARTER_EPIC_ID } from '@/lib/game'

interface Props {
  onStart: () => void
}

// Persistent motivational widget shown on desktop, top-left below the pills column,
// when Mode Chercheur is NOT active. Invites the visitor to start the Cathar epic.
// Disappears once the mode is active (ChercheurHUD takes over as the game widget).
export function QuestBanner({ onStart }: Props) {
  const epic = getEpic(STARTER_EPIC_ID)
  if (!epic) return null

  return (
    <motion.button
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.6, delay: 0.6 }}
      onClick={onStart}
      className="hidden md:flex absolute top-[10rem] left-2 md:left-4 z-20 pointer-events-auto flex-col gap-2 w-[240px] glass rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-400/10 to-transparent backdrop-blur-md p-3 shadow-lg hover:border-amber-400/50 transition-colors text-left group"
      aria-label="Commencer l'épopée cathare"
    >
      <div className="flex items-center gap-1.5">
        <Sparkles className="w-3 h-3 text-amber-300" />
        <span className="text-[10px] uppercase tracking-widest text-amber-300 font-semibold">
          Quête du chercheur
        </span>
      </div>

      <div className="flex items-start gap-2">
        <div
          className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-lg"
          style={{ background: `${epic.color}25`, color: epic.color }}
        >
          {epic.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-white leading-tight">{epic.title}</div>
          <div className="text-[10px] text-white/60 mt-0.5 leading-snug line-clamp-2">
            Suivez les traces des « Bons Hommes », de Béziers à Montségur
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 rounded-lg bg-amber-400/10 border border-amber-400/20 group-hover:bg-amber-400/15 group-hover:border-amber-400/40 transition-colors px-2.5 py-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-200">
          <Flame className="w-3 h-3" />
          <span>Commencer l&apos;épopée</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-amber-300 group-hover:translate-x-0.5 transition-transform" />
      </div>

      <div className="text-[9px] text-white/40 leading-tight">
        {epic.places.length} lieux · gagnez XP + badges
      </div>
    </motion.button>
  )
}
