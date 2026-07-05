'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { Sparkles } from 'lucide-react'

interface Props {
  delta: number
  onDismiss: () => void
}

// Small floating "+N XP" confirmation, shown above the badge toast slot.
export function XpToast({ delta, onDismiss }: Props) {
  useEffect(() => {
    if (delta <= 0) return
    const t = setTimeout(onDismiss, 2500)
    return () => clearTimeout(t)
  }, [delta, onDismiss])

  return (
    <AnimatePresence>
      {delta > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.95 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="fixed bottom-40 left-1/2 -translate-x-1/2 z-[80] pointer-events-none"
          style={{ x: '-50%' }}
        >
          <div className="flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-black/80 backdrop-blur-md px-3.5 py-1.5 shadow-[0_0_30px_-8px_rgba(251,191,36,0.5)]">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-sm font-bold text-amber-300 tabular-nums">+{delta} XP</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
