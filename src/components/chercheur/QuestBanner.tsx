'use client'

import { motion } from 'framer-motion'
import { Flame, ChevronRight } from 'lucide-react'
import { getEpic, STARTER_EPIC_ID } from '@/lib/game'

interface Props {
  onStart: () => void
}

// Compact motivational widget shown on desktop, top-left below the pills column,
// only when Mode Chercheur is INACTIVE. Height ~5.5rem so it sits above the
// vertically-centered music player without overlapping.
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
      className="hidden md:flex absolute top-[10rem] left-4 z-20 pointer-events-auto items-center gap-2.5 w-[210px] glass rounded-xl border border-amber-400/30 bg-gradient-to-br from-amber-400/12 to-transparent backdrop-blur-md pl-2 pr-3 py-2 shadow-lg hover:border-amber-400/60 hover:from-amber-400/20 transition-colors text-left group"
      aria-label="Commencer l'épopée cathare"
    >
      <div
        className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-xl"
        style={{ background: `${epic.color}30`, color: epic.color }}
      >
        {epic.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-amber-300 font-semibold">
          <Flame className="w-2.5 h-2.5" />
          Commencer la quête
        </div>
        <div className="text-xs font-semibold text-white truncate">{epic.title}</div>
        <div className="text-[9px] text-white/50 truncate">{epic.places.length} lieux · XP + badges</div>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-amber-300 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
    </motion.button>
  )
}
