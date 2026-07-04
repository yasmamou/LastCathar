'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Download, Share, Smartphone, Plus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { usePwa } from './PwaProvider'

const LS_DISMISSED_AT = 'pwa:dismissed-at'
const HIDE_FOR_DAYS = 7

export function InstallPrompt() {
  const pwa = usePwa()
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = localStorage.getItem(LS_DISMISSED_AT)
    if (!raw) {
      setDismissed(false)
      return
    }
    const at = Number(raw)
    const days = (Date.now() - at) / (1000 * 60 * 60 * 24)
    setDismissed(days < HIDE_FOR_DAYS)
  }, [])

  const dismiss = () => {
    localStorage.setItem(LS_DISMISSED_AT, String(Date.now()))
    setDismissed(true)
  }

  const shouldShow =
    !dismissed &&
    !pwa.isStandalone &&
    pwa.platform !== 'unsupported' &&
    (pwa.canInstallNative || pwa.platform === 'ios')

  const handleClick = async () => {
    if (pwa.canInstallNative) {
      const outcome = await pwa.promptInstall()
      if (outcome === 'accepted') dismiss()
    } else if (pwa.platform === 'ios') {
      pwa.openManualInstructions()
    }
  }

  return (
    <>
      <AnimatePresence>
        {shouldShow && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            onClick={handleClick}
            className="glass rounded-full pl-3 pr-2 py-1.5 text-[10px] tracking-wider uppercase text-amber-300 hover:text-amber-200 active:text-amber-100 border border-amber-400/20 hover:border-amber-400/40 transition-colors flex items-center gap-1.5"
            aria-label="Installer l'application"
          >
            <Download className="w-3 h-3" />
            <span>Installer l&apos;app</span>
            <span
              onClick={(e) => {
                e.stopPropagation()
                dismiss()
              }}
              className="ml-1 text-white/30 hover:text-white/60 px-1"
              role="button"
              aria-label="Ignorer"
            >
              ✕
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <IosInstructionsModal
        isOpen={pwa.showManualInstructions && pwa.platform === 'ios'}
        onClose={pwa.closeManualInstructions}
      />
    </>
  )
}

function IosInstructionsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
          style={{
            background: 'rgba(5,6,13,0.85)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl border border-amber-400/20 bg-gradient-to-b from-[#0f1120] to-[#05060d] p-6 sm:p-8 shadow-[0_0_80px_-15px_rgba(251,191,36,0.4)]"
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-white/30 hover:text-white/70 transition p-1"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="w-4 h-4 text-amber-300" />
              <span className="text-[10px] uppercase tracking-widest text-amber-300 font-semibold">
                Installation iPhone / iPad
              </span>
            </div>

            <h3 className="font-serif text-2xl font-semibold text-white mb-2">
              Ajouter à l&apos;écran d&apos;accueil
            </h3>
            <p className="text-sm text-white/60 mb-6">
              Suivez ces 3 étapes dans Safari pour installer Last Cathar comme une vraie
              application.
            </p>

            <ol className="space-y-3">
              <li className="flex items-start gap-3 rounded-lg bg-white/5 p-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-400 text-black text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <div className="flex-1 text-sm">
                  <div className="text-white">
                    Touchez le bouton{' '}
                    <span className="inline-flex items-center align-middle mx-0.5 gap-1 rounded bg-white/10 px-1.5 py-0.5 text-xs">
                      <Share className="w-3 h-3" /> Partager
                    </span>
                  </div>
                  <div className="text-white/50 text-xs mt-0.5">
                    En bas de l&apos;écran dans Safari
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3 rounded-lg bg-white/5 p-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-400 text-black text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <div className="flex-1 text-sm">
                  <div className="text-white">
                    Faites défiler et choisissez{' '}
                    <span className="inline-flex items-center align-middle mx-0.5 gap-1 rounded bg-white/10 px-1.5 py-0.5 text-xs">
                      <Plus className="w-3 h-3" /> Sur l&apos;écran d&apos;accueil
                    </span>
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3 rounded-lg bg-white/5 p-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-400 text-black text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <div className="flex-1 text-sm">
                  <div className="text-white">Confirmez avec &laquo; Ajouter &raquo;</div>
                  <div className="text-white/50 text-xs mt-0.5">
                    L&apos;icône Last Cathar apparaîtra avec vos autres apps
                  </div>
                </div>
              </li>
            </ol>

            <div className="mt-6 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-amber-200/80">
              💡 Sur iPhone, l&apos;installation n&apos;est possible que depuis <b>Safari</b>. Si
              vous utilisez Chrome ou une autre app, ouvrez d&apos;abord ce site dans Safari.
            </div>

            <button
              onClick={onClose}
              className="mt-6 w-full rounded-lg bg-amber-400 py-3 text-sm font-semibold text-black hover:bg-amber-300 transition"
            >
              J&apos;ai compris
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
