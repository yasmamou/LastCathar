'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Compass, Flame, Sparkles, X } from 'lucide-react'
import { getEpic, STARTER_EPIC_ID } from '@/lib/game'

interface Props {
  isOpen: boolean
  onStart: () => void
  onDismiss: () => void
}

export function WelcomeChercheurModal({ isOpen, onStart, onDismiss }: Props) {
  const epic = getEpic(STARTER_EPIC_ID)
  if (!epic) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(5,6,13,0.85) 0%, rgba(5,6,13,0.98) 70%)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <motion.div
            initial={{ scale: 0.92, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative max-w-lg w-full rounded-2xl border border-amber-400/20 bg-gradient-to-b from-[#0f1120] to-[#05060d] p-8 sm:p-10 shadow-[0_0_80px_-15px_rgba(251,191,36,0.4)]"
          >
            <button
              onClick={onDismiss}
              className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] uppercase tracking-widest text-amber-300">
                <Sparkles className="w-3 h-3" />
                Mode Chercheur
              </div>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-white leading-tight mb-3">
              Suivez la trace des <span className="text-amber-300">Cathares</span>
            </h2>

            <p className="text-white/70 text-sm sm:text-base leading-relaxed mb-6">
              Bienvenue, chercheur. Vous êtes sur le point d&apos;entrer dans une des grandes histoires
              perdues du Languedoc — la croisade albigeoise, ses forteresses imprenables, ses
              trésors dissimulés, son bûcher final à Montségur.
            </p>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 mb-6">
              <div className="flex items-start gap-3">
                <div
                  className="flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center text-xl"
                  style={{ background: `${epic.color}20`, color: epic.color }}
                >
                  {epic.icon}
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-white/40 mb-0.5">
                    Épopée de départ
                  </div>
                  <div className="text-white font-medium mb-1">{epic.title}</div>
                  <div className="text-xs text-white/60 flex items-center gap-2">
                    <Flame className="w-3 h-3" />
                    {epic.places.length} lieux — départ à Carcassonne, 1209
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-8 text-sm text-white/70">
              <div className="flex items-start gap-2">
                <span className="text-amber-300 mt-0.5">✦</span>
                <span>Chaque lieu visité rapporte de l&apos;<b className="text-amber-300">XP</b> et fait progresser votre rang de chercheur.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-300 mt-0.5">✦</span>
                <span>Débloquez des <b className="text-amber-300">badges</b> aux étapes clés de l&apos;épopée.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-300 mt-0.5">✦</span>
                <span>Vous pouvez à tout moment explorer librement le globe — la piste reste sauvegardée.</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onStart}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-amber-400 px-5 py-3 text-sm font-semibold text-black hover:bg-amber-300 transition"
              >
                <Compass className="w-4 h-4" />
                Commencer l&apos;épopée à Carcassonne
              </button>
              <button
                onClick={onDismiss}
                className="rounded-lg border border-white/15 px-5 py-3 text-sm text-white/70 hover:bg-white/5 hover:text-white transition"
              >
                Explorer librement
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
