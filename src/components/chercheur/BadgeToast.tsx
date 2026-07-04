'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { BADGE_MAP } from '@/lib/game'

interface Props {
  badges: string[]
  onDismiss: () => void
}

export function BadgeToast({ badges, onDismiss }: Props) {
  useEffect(() => {
    if (badges.length === 0) return
    const t = setTimeout(onDismiss, 5000)
    return () => clearTimeout(t)
  }, [badges, onDismiss])

  return (
    <AnimatePresence>
      {badges.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] pointer-events-auto"
        >
          <div className="rounded-2xl border border-amber-400/40 bg-gradient-to-b from-[#1a1408] to-[#0a0a0a] p-4 shadow-[0_0_60px_-10px_rgba(251,191,36,0.6)] min-w-[280px] max-w-md">
            <div className="text-[10px] uppercase tracking-widest text-amber-300 mb-2">
              {badges.length > 1 ? `${badges.length} badges débloqués` : 'Badge débloqué'}
            </div>
            <div className="space-y-2">
              {badges.map((slug) => {
                const b = BADGE_MAP[slug]
                if (!b) return null
                return (
                  <div key={slug} className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: `${b.color}25`, color: b.color }}
                    >
                      {b.icon}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{b.label}</div>
                      <div className="text-xs text-white/60 leading-snug">{b.description}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <button
              onClick={onDismiss}
              className="mt-3 w-full text-[10px] uppercase tracking-widest text-white/40 hover:text-white/70 transition"
            >
              Fermer
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
