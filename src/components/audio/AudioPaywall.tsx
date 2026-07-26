'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Headphones, Loader2, Sparkles } from 'lucide-react'
import { useLang } from '@/lib/lang'
import { useAudioGate } from '@/lib/audio-gate'

interface Props {
  open: boolean
  onClose: () => void
  onNeedAuth: () => void
}

const T = {
  fr: {
    kicker: 'Pass Audioguides',
    title: 'Débloquez toute l’épopée cathare',
    body: 'Un seul paiement débloque à vie l’audioguide de TOUTES les citadelles de l’épopée cathare — Carcassonne, Montségur, Quéribus, Peyrepertuse, Foix, Béziers… et tous les parcours de Last Cathar.',
    price: '4,90 €',
    once: 'paiement unique · toutes les citadelles · à vie',
    unlock: 'Créer mon compte et payer 4,90 €',
    login: 'Créer mon compte pour débloquer',
    back: 'Revenir à la carte',
    err: 'Une erreur est survenue',
  },
  en: {
    kicker: 'Audio Pass',
    title: 'Unlock the whole Cathar epic',
    body: 'A single payment unlocks lifetime access to the audioguide of EVERY citadel of the Cathar epic — Carcassonne, Montségur, Quéribus, Peyrepertuse, Foix, Béziers… and all Last Cathar tours.',
    price: '€4.90',
    once: 'one-time payment · all citadels · lifetime',
    unlock: 'Create account & pay €4.90',
    login: 'Create account to unlock',
    back: 'Back to the map',
    err: 'Something went wrong',
  },
} as const

export function AudioPaywall({ open, onClose, onNeedAuth }: Props) {
  const [lang] = useLang()
  const { access, startAudioCheckout } = useAudioGate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const t = T[lang]

  const handleUnlock = async () => {
    setError('')
    if (!access.authenticated) {
      onNeedAuth()
      return
    }
    setLoading(true)
    const res = await startAudioCheckout()
    if (!res.ok) {
      if (res.needAuth) onNeedAuth()
      else setError(res.error || t.err)
      setLoading(false)
    }
    // On success the browser redirects to Stripe.
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center px-4"
          style={{ background: 'rgba(5,6,13,0.92)', backdropFilter: 'blur(10px)' }}
        >
          <motion.div
            initial={{ scale: 0.94, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            className="relative w-full max-w-sm rounded-2xl border border-amber-400/25 bg-gradient-to-b from-[#0f1120] to-[#05060d] p-6 shadow-[0_0_70px_-15px_rgba(251,191,36,0.6)]"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-400/15 flex items-center justify-center mb-4">
              <Headphones className="w-7 h-7 text-amber-300" />
            </div>
            <div className="text-[10px] uppercase tracking-widest text-amber-300/70 font-semibold mb-1">
              {t.kicker}
            </div>
            <h3 className="font-serif text-2xl font-semibold text-white mb-2">{t.title}</h3>
            <p className="text-sm text-white/60 leading-relaxed mb-4">{t.body}</p>

            <div className="flex items-baseline gap-2 mb-5">
              <span className="text-3xl font-bold text-amber-300">{t.price}</span>
              <span className="text-xs text-white/40">· {t.once}</span>
            </div>

            {error && <p className="text-xs text-red-400/80 mb-3">{error}</p>}

            <button
              onClick={handleUnlock}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-amber-400 text-midnight-950 font-semibold text-sm hover:bg-amber-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {access.authenticated ? t.unlock : t.login}
            </button>
            <button
              onClick={onClose}
              className="mt-4 w-full text-center text-[10px] text-white/25 hover:text-white/45 transition-colors"
            >
              {t.back}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
