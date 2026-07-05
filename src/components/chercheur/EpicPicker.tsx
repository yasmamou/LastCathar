'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X, Check, Play, Lock } from 'lucide-react'
import { EPICS } from '@/data/epics'
import type { GameState } from './useChercheur'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSelectEpic: (epicId: string) => void
  activeEpicId: string
  state: GameState | null
}

export function EpicPicker({ isOpen, onClose, onSelectEpic, activeEpicId, state }: Props) {
  const progressByEpic: Record<string, { visitedSlugs: string[]; completed: boolean }> = {}
  for (const p of state?.progress ?? []) {
    progressByEpic[p.epicId] = { visitedSlugs: p.visitedSlugs, completed: !!p.completedAt }
  }

  const completedCount = EPICS.filter((e) => progressByEpic[e.id]?.completed).length
  const inProgressCount = EPICS.filter(
    (e) => progressByEpic[e.id] && !progressByEpic[e.id].completed,
  ).length

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-3 pb-3 md:p-8"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(5,6,13,0.9) 0%, rgba(5,6,13,0.98) 70%)',
            backdropFilter: 'blur(6px)',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-amber-400/25 bg-gradient-to-b from-[#0f1120] to-[#05060d] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-amber-300 font-semibold mb-0.5">
                  Mode Chercheur
                </div>
                <h2 className="font-serif text-xl md:text-2xl font-semibold text-white">
                  Épopées ({EPICS.length})
                </h2>
                <div className="text-xs text-white/50 mt-1">
                  <span className="text-emerald-400">{completedCount}</span> terminée
                  {completedCount > 1 ? 's' : ''} ·{' '}
                  <span className="text-amber-300">{inProgressCount}</span> en cours ·{' '}
                  <span className="text-white/40">{EPICS.length - completedCount - inProgressCount}</span>{' '}
                  à découvrir
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/40 hover:text-white/80 transition p-1"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Epic grid */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid gap-2 sm:grid-cols-2">
                {EPICS.map((epic) => {
                  const progress = progressByEpic[epic.id]
                  const visited = progress?.visitedSlugs.length ?? 0
                  const total = epic.places.length
                  const ratio = total === 0 ? 0 : visited / total
                  const isActive = epic.id === activeEpicId
                  const isComplete = progress?.completed

                  return (
                    <button
                      key={epic.id}
                      onClick={() => {
                        onSelectEpic(epic.id)
                        onClose()
                      }}
                      className={`relative text-left rounded-xl border p-3 transition-all ${
                        isActive
                          ? 'border-amber-400/60 bg-amber-400/10 ring-2 ring-amber-400/30'
                          : isComplete
                            ? 'border-emerald-400/30 bg-emerald-400/5 hover:border-emerald-400/50'
                            : visited > 0
                              ? 'border-amber-400/20 bg-white/[0.03] hover:border-amber-400/40'
                              : 'border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute -top-2 -right-2 rounded-full bg-amber-400 text-black text-[9px] font-bold px-1.5 py-0.5">
                          EN COURS
                        </div>
                      )}
                      {isComplete && (
                        <div className="absolute top-2 right-2 rounded-full bg-emerald-400/20 border border-emerald-400/40 p-1">
                          <Check className="w-3 h-3 text-emerald-400" />
                        </div>
                      )}

                      <div className="flex items-start gap-3 mb-2">
                        <div
                          className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                          style={{ background: `${epic.color}25`, color: epic.color }}
                        >
                          {epic.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-white leading-tight truncate">
                            {epic.title}
                          </div>
                          <div className="text-[10px] text-white/50 line-clamp-2 mt-0.5">
                            {epic.subtitle}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-1 text-[10px]">
                        <span className="text-white/50">
                          {visited} / {total} lieux
                        </span>
                        <span
                          className={
                            isComplete
                              ? 'text-emerald-400 font-semibold'
                              : visited > 0
                                ? 'text-amber-300 font-semibold'
                                : 'text-white/30'
                          }
                        >
                          {isComplete ? '✓ Terminée' : visited > 0 ? `${Math.round(ratio * 100)} %` : 'À découvrir'}
                        </span>
                      </div>
                      <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(ratio * 100).toFixed(0)}%`,
                            background: isComplete
                              ? 'linear-gradient(90deg, #10b981, #34d399)'
                              : `linear-gradient(90deg, ${epic.color}, #facc15)`,
                          }}
                        />
                      </div>

                      <div className="flex items-center gap-1 mt-2 text-[10px]">
                        {isActive ? (
                          <span className="text-amber-300">Continuer →</span>
                        ) : isComplete ? (
                          <span className="text-emerald-400/70 flex items-center gap-1">
                            <Play className="w-2.5 h-2.5" />
                            Revisiter
                          </span>
                        ) : visited > 0 ? (
                          <span className="text-amber-300 flex items-center gap-1">
                            <Play className="w-2.5 h-2.5" />
                            Reprendre
                          </span>
                        ) : (
                          <span className="text-white/40 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            Démarrer
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
