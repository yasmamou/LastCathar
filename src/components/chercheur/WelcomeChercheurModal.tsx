'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Compass, Flame, Sparkles, X } from 'lucide-react'
import { getEpic, STARTER_EPIC_ID } from '@/lib/game'
import { useLang } from '@/lib/lang'
import { LangToggle } from '@/components/layout/LangToggle'

interface Props {
  isOpen: boolean
  onStart: () => void
  onDismiss: () => void
}

const T = {
  fr: {
    badge: 'Mode Chercheur',
    titleA: 'Suivez la trace des ',
    titleHi: 'Cathares',
    intro:
      "Bienvenue, chercheur. Vous êtes sur le point d'entrer dans une des grandes histoires perdues du Languedoc — la croisade albigeoise, ses forteresses imprenables, ses trésors dissimulés, son bûcher final à Montségur.",
    epicLabel: 'Épopée de départ',
    epicPlaces: (n: number) => `${n} lieux — départ à Carcassonne, 1209`,
    b1a: 'Chaque lieu visité rapporte de l’',
    b1b: 'XP',
    b1c: ' et fait progresser votre rang de chercheur.',
    b2a: 'Débloquez des ',
    b2b: 'badges',
    b2c: ' aux étapes clés de l’épopée.',
    b3: 'Vous pouvez à tout moment explorer librement le globe — la piste reste sauvegardée.',
    start: "Commencer l'épopée à Carcassonne",
    free: 'Explorer librement',
    close: 'Fermer',
  },
  en: {
    badge: 'Seeker Mode',
    titleA: 'Follow the trail of the ',
    titleHi: 'Cathars',
    intro:
      "Welcome, seeker. You are about to enter one of the great lost stories of the Languedoc — the Albigensian Crusade, its impregnable fortresses, its hidden treasures, and its final pyre at Montségur.",
    epicLabel: 'Starting epic',
    epicPlaces: (n: number) => `${n} places — starting at Carcassonne, 1209`,
    b1a: 'Every place you visit earns ',
    b1b: 'XP',
    b1c: ' and raises your seeker rank.',
    b2a: 'Unlock ',
    b2b: 'badges',
    b2c: ' at the key milestones of the epic.',
    b3: 'You can roam the globe freely at any time — your trail is always saved.',
    start: 'Begin the epic at Carcassonne',
    free: 'Explore freely',
    close: 'Close',
  },
} as const

export function WelcomeChercheurModal({ isOpen, onStart, onDismiss }: Props) {
  const [lang, setLang] = useLang()
  const epic = getEpic(STARTER_EPIC_ID)
  if (!epic) return null
  const t = T[lang]

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
            {/* Top bar: language toggle + close */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <LangToggle lang={lang} onChange={setLang} />
              <button
                onClick={onDismiss}
                className="text-white/30 hover:text-white/70 transition"
                aria-label={t.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] uppercase tracking-widest text-amber-300">
                <Sparkles className="w-3 h-3" />
                {t.badge}
              </div>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-white leading-tight mb-3">
              {t.titleA}
              <span className="text-amber-300">{t.titleHi}</span>
            </h2>

            <p className="text-white/70 text-sm sm:text-base leading-relaxed mb-6">{t.intro}</p>

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
                    {t.epicLabel}
                  </div>
                  <div className="text-white font-medium mb-1">{epic.title}</div>
                  <div className="text-xs text-white/60 flex items-center gap-2">
                    <Flame className="w-3 h-3" />
                    {t.epicPlaces(epic.places.length)}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-8 text-sm text-white/70">
              <div className="flex items-start gap-2">
                <span className="text-amber-300 mt-0.5">✦</span>
                <span>{t.b1a}<b className="text-amber-300">{t.b1b}</b>{t.b1c}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-300 mt-0.5">✦</span>
                <span>{t.b2a}<b className="text-amber-300">{t.b2b}</b>{t.b2c}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-300 mt-0.5">✦</span>
                <span>{t.b3}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onStart}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-amber-400 px-5 py-3 text-sm font-semibold text-black hover:bg-amber-300 transition"
              >
                <Compass className="w-4 h-4" />
                {t.start}
              </button>
              <button
                onClick={onDismiss}
                className="rounded-lg border border-white/15 px-5 py-3 text-sm text-white/70 hover:bg-white/5 hover:text-white transition"
              >
                {t.free}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
