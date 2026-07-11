'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSession, signIn } from 'next-auth/react'
import { X, Play, Pause, ChevronLeft, ChevronRight, FileText, MapPin, Sparkles, Loader2, Mail, Lock, ShoppingBag, ExternalLink, Plus } from 'lucide-react'
import type { Tour } from '@/data/carcassonne-tour'
import type { GuideLang } from '@/data/audio-guides'
import { useLang } from '@/lib/lang'
import { STARTER_EPIC_ID, STARTER_PLACE_SLUG } from '@/lib/game'

interface Props {
  tour: Tour
  onClose: () => void
}

const IMAGE_INTERVAL = 5000 // défilement auto des images (ms)
const XP_PER_STOP = 25 // XP gagné en franchissant chaque étape

const UI = {
  fr: {
    of: 'sur', prev: 'Précédent', next: 'Suivant', transcript: 'Texte', finish: 'Terminer la visite',
    enter: 'Reprendre', auto: 'Enchaînement auto', xp: 'XP',
    obTitle: 'Bravo, chercheur !', obXp: (n: number) => `Vous avez déjà gagné ${n} XP`,
    obBody: 'Créez votre compte pour sauvegarder votre progression et vos badges — puis continuez la visite.',
    email: 'Votre email', pass: 'Mot de passe (6+ caractères)',
    create: 'Créer mon compte & continuer', later: 'Plus tard, continuer la visite',
    saved: 'Progression sauvegardée ✦', errGeneric: 'Une erreur est survenue',
    localProducts: 'Produits locaux', yourProduct: 'Votre produit ici →',
  },
  en: {
    of: 'of', prev: 'Previous', next: 'Next', transcript: 'Text', finish: 'Finish the tour',
    enter: 'Resume', auto: 'Auto-advance', xp: 'XP',
    obTitle: 'Well done, seeker!', obXp: (n: number) => `You have already earned ${n} XP`,
    obBody: 'Create your account to save your progress and badges — then continue the tour.',
    email: 'Your email', pass: 'Password (6+ characters)',
    create: 'Create my account & continue', later: 'Later, continue the tour',
    saved: 'Progress saved ✦', errGeneric: 'Something went wrong',
    localProducts: 'Local products', yourProduct: 'Your product here →',
  },
} as const

function fmt(s: number) {
  const m = Math.floor(s / 60)
  const r = Math.floor(s % 60)
  return `${m}:${r.toString().padStart(2, '0')}`
}

function emitGuideState(playing: boolean) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('audioguide:state', { detail: { playing } }))
  }
}

export function CarcassonneTour({ tour, onClose }: Props) {
  const { status } = useSession()
  const [lang, setLang] = useLang()
  const [stopIndex, setStopIndex] = useState(0)
  const [imageIndex, setImageIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showTranscript, setShowTranscript] = useState(false)
  const [autoAdvance, setAutoAdvance] = useState(true)

  // Onboarding: XP accrual + account/email capture from stop 2 onward.
  const [maxStopReached, setMaxStopReached] = useState(0)
  const [showOnboard, setShowOnboard] = useState(false)
  const onboardDoneRef = useRef(false)
  const [obEmail, setObEmail] = useState('')
  const [obPass, setObPass] = useState('')
  const [obLoading, setObLoading] = useState(false)
  const [obError, setObError] = useState('')
  const [obSaved, setObSaved] = useState(false)

  // Local products for this place — shown while listening to the tour.
  const [tourProducts, setTourProducts] = useState<
    { id: string; title: string; price: string | null; imageUrls: string[]; externalUrl: string | null }[]
  >([])

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const autoAdvanceRef = useRef(autoAdvance)
  autoAdvanceRef.current = autoAdvance

  useEffect(() => {
    let cancelled = false
    fetch(`/api/products?placeSlug=${encodeURIComponent(tour.placeSlug)}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setTourProducts(data.products ?? []) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [tour.placeSlug])

  const openProduct = (p: { id: string; externalUrl: string | null }) => {
    fetch('/api/products/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: p.id, placeSlug: tour.placeSlug }),
    }).catch(() => {})
    if (p.externalUrl) window.open(p.externalUrl, '_blank', 'noopener,noreferrer')
  }

  const stop = tour.stops[stopIndex]
  const track = stop.audio[lang]
  const T = UI[lang]
  const isLast = stopIndex === tour.stops.length - 1
  const xp = maxStopReached * XP_PER_STOP

  // Track furthest stop reached (for XP) and trigger the onboarding prompt the
  // first time an anonymous visitor reaches stop 2 (index 1).
  useEffect(() => {
    setMaxStopReached((m) => Math.max(m, stopIndex))
    if (
      stopIndex >= 1 &&
      status === 'unauthenticated' &&
      !onboardDoneRef.current &&
      !showOnboard
    ) {
      onboardDoneRef.current = true
      setShowOnboard(true)
      audioRef.current?.pause()
      setPlaying(false)
      emitGuideState(false)
    }
  }, [stopIndex, status, showOnboard])

  const submitOnboard = async (e: React.FormEvent) => {
    e.preventDefault()
    setObError('')
    if (!obEmail.trim() || obPass.length < 6) {
      setObError(T.errGeneric)
      return
    }
    setObLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: obEmail.trim(), password: obPass }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok && res.status !== 409) {
        setObError(data.error || T.errGeneric)
        setObLoading(false)
        return
      }
      // Sign in (works for both new account and existing email)
      const signRes = await signIn('credentials', { email: obEmail.trim(), password: obPass, redirect: false })
      if (signRes?.error) {
        setObError(data.error || T.errGeneric)
        setObLoading(false)
        return
      }
      // Grant real XP by recording the Carcassonne visit in the starter epic.
      await fetch('/api/game/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ epicId: STARTER_EPIC_ID, placeSlug: STARTER_PLACE_SLUG }),
      }).catch(() => {})
      setObSaved(true)
      setObLoading(false)
      // Return to stop 2 (where they are) and resume after a short beat.
      setTimeout(() => { setShowOnboard(false); resumeAudio() }, 1400)
    } catch {
      setObError(T.errGeneric)
      setObLoading(false)
    }
  }

  const resumeAudio = () => {
    audioRef.current?.play().then(() => { setPlaying(true); emitGuideState(true) }).catch(() => {})
  }

  const skipOnboard = () => { setShowOnboard(false); resumeAudio() }

  const goToStop = useCallback((i: number) => {
    setStopIndex(Math.max(0, Math.min(tour.stops.length - 1, i)))
    setImageIndex(0)
    setProgress(0)
    setShowTranscript(false)
  }, [tour.stops.length])

  // (Re)build the audio element when stop or language changes; auto-play.
  useEffect(() => {
    const audio = new Audio(track.file)
    audio.preload = 'auto'
    audioRef.current = audio

    const onTime = () => setProgress(audio.currentTime)
    const onMeta = () => setDuration(audio.duration || track.duration)
    const onEnded = () => {
      setPlaying(false)
      emitGuideState(false)
      // Enchaînement automatique vers l'étape suivante
      if (autoAdvanceRef.current) {
        setStopIndex((idx) => {
          if (idx < tour.stops.length - 1) {
            setImageIndex(0)
            setProgress(0)
            setShowTranscript(false)
            return idx + 1
          }
          return idx
        })
      }
    }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('ended', onEnded)

    setDuration(track.duration)
    setProgress(0)
    // Autoplay (allowed: opening the tour is a user gesture)
    audio.play().then(() => { setPlaying(true); emitGuideState(true) }).catch(() => setPlaying(false))

    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('ended', onEnded)
      audio.pause()
      audio.src = ''
      emitGuideState(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopIndex, lang])

  // Slowly auto-advance the images of the current stop.
  useEffect(() => {
    if (stop.images.length < 2) return
    const t = setInterval(() => {
      setImageIndex((i) => (i + 1) % stop.images.length)
    }, IMAGE_INTERVAL)
    return () => clearInterval(t)
  }, [stopIndex, stop.images.length])

  // Escape closes the tour.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) { audio.pause(); setPlaying(false); emitGuideState(false) }
    else audio.play().then(() => { setPlaying(true); emitGuideState(true) }).catch(() => {})
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const r = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    audio.currentTime = r * duration
    setProgress(audio.currentTime)
  }

  const switchLang = (next: GuideLang) => {
    if (next === lang) return
    audioRef.current?.pause()
    setPlaying(false)
    setLang(next)
  }

  const img = stop.images[imageIndex]
  const ratio = duration > 0 ? progress / duration : 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[95] bg-[#05060d] flex flex-col"
    >
      {/* Background image (crossfade) */}
      <div className="absolute inset-0 overflow-hidden">
        <AnimatePresence mode="popLayout">
          {img && (
            <motion.img
              key={`${stop.id}-${imageIndex}`}
              src={img.src}
              alt=""
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ opacity: { duration: 1.2 }, scale: { duration: IMAGE_INTERVAL / 1000 + 1, ease: 'linear' } }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-[#05060d] via-[#05060d]/50 to-[#05060d]/70" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 md:px-6 pt-4 pb-2 safe-top">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-gold-400/70 font-semibold">
            <MapPin className="w-3 h-3" /> {tour.title[lang]}
          </div>
          <div className="text-[11px] text-white/40 mt-0.5">
            {T.prev === 'Précédent' ? 'Étape' : 'Stop'} {stopIndex + 1} {T.of} {tour.stops.length}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* XP earned during the tour */}
          {xp > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-amber-400/15 border border-amber-400/30 px-2.5 py-1 text-[10px] font-bold text-amber-300 tabular-nums">
              <Sparkles className="w-3 h-3" /> {xp} {T.xp}
            </div>
          )}
          <div className="flex items-center rounded-full bg-black/40 border border-white/10 overflow-hidden text-[10px] font-semibold">
            {(['fr', 'en'] as const).map((code) => (
              <button
                key={code}
                onClick={() => switchLang(code)}
                aria-pressed={lang === code}
                className={`px-2.5 py-1 uppercase tracking-wider transition-colors ${
                  lang === code ? 'bg-gold-400 text-midnight-950' : 'text-white/50 hover:text-white/90'
                }`}
              >
                {code}
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer la visite"
            className="w-9 h-9 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Image credit */}
      {img && (
        <div className="relative z-10 px-4 md:px-6">
          <p className="text-[9px] text-white/30 italic">
            📷 {img.artist} — {img.license} · Wikimedia Commons
          </p>
        </div>
      )}

      {/* Spacer pushes content to the bottom */}
      <div className="flex-1" />

      {/* Local products — visible while listening to the audio guide */}
      {tourProducts.length > 0 && (
        <div className="relative z-10 px-4 md:px-6 mb-2">
          <div className="mx-auto max-w-2xl">
            <div className="flex items-center gap-1.5 mb-1.5 text-[10px] uppercase tracking-widest text-amber-300/80">
              <ShoppingBag className="w-3 h-3" /> {T.localProducts}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {tourProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => openProduct(p)}
                  className="group flex-shrink-0 w-[190px] flex items-center gap-2 rounded-xl border border-amber-400/20 bg-black/50 backdrop-blur-md p-2 text-left hover:border-amber-400/50 transition-colors"
                  title={p.title}
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                    {p.imageUrls?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrls[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-amber-300/40">🛍️</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-medium text-white truncate group-hover:text-amber-200 transition-colors">{p.title}</div>
                    {p.price && <div className="text-[10px] text-amber-300/80 truncate">{p.price}</div>}
                  </div>
                  <ExternalLink className="w-3 h-3 text-white/30 flex-shrink-0" />
                </button>
              ))}
              {/* Reserve-a-slot CTA */}
              <a
                href="/pricing"
                className="flex-shrink-0 w-[150px] flex items-center gap-2 rounded-xl border border-dashed border-amber-400/30 bg-amber-400/5 p-2 hover:bg-amber-400/10 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-400/10 flex items-center justify-center flex-shrink-0">
                  <Plus className="w-4 h-4 text-amber-300" />
                </div>
                <div className="text-[10px] font-medium text-amber-300 leading-tight">{T.yourProduct}</div>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Content card */}
      <div className="relative z-10 px-4 md:px-6 pb-4 safe-bottom">
        <motion.div
          key={stop.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-black/55 backdrop-blur-xl p-5"
        >
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-white leading-tight">
            {stop.title[lang]}
          </h2>
          <p className="text-sm text-gold-400/70 mt-0.5">{stop.subtitle[lang]}</p>

          {/* Audio player */}
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={toggle}
              aria-label={playing ? 'Pause' : 'Play'}
              className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                playing ? 'bg-gold-400 text-midnight-950 shadow-lg shadow-gold-400/25' : 'bg-gold-400/20 text-gold-400 hover:bg-gold-400/30'
              }`}
            >
              {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <div className="flex-1 min-w-0">
              <div
                onClick={seek}
                className="h-2 rounded-full bg-white/10 cursor-pointer"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={Math.round(duration)}
                aria-valuenow={Math.round(progress)}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-300 transition-[width] duration-200"
                  style={{ width: `${(ratio * 100).toFixed(1)}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1 text-[10px] text-white/40 tabular-nums">
                <span>{fmt(progress)} / {fmt(duration)}</span>
                <button
                  onClick={() => setShowTranscript((v) => !v)}
                  className="flex items-center gap-1 text-white/40 hover:text-gold-400/80 transition-colors uppercase tracking-wider"
                  aria-expanded={showTranscript}
                >
                  <FileText className="w-3 h-3" /> {T.transcript}
                </button>
              </div>
            </div>
          </div>

          {/* Transcript */}
          <AnimatePresence>
            {showTranscript && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 max-h-40 overflow-y-auto rounded-lg bg-black/40 border border-white/5 px-3 py-2.5">
                  {stop.text[lang].split('\n\n').map((p, i) => (
                    <p key={i} className="text-xs text-white/65 leading-relaxed mb-2 last:mb-0">{p}</p>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              onClick={() => goToStop(stopIndex - 1)}
              disabled={stopIndex === 0}
              className="flex items-center gap-1 text-xs text-white/50 hover:text-white/90 transition-colors disabled:opacity-25 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" /> {T.prev}
            </button>

            {/* Progress dots */}
            <div className="flex items-center gap-1.5">
              {tour.stops.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => goToStop(i)}
                  aria-label={`${s.title[lang]}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === stopIndex ? 'w-6 bg-gold-400' : 'w-1.5 bg-white/25 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>

            {isLast ? (
              <button
                onClick={onClose}
                className="flex items-center gap-1 text-xs font-semibold text-gold-400 hover:text-gold-300 transition-colors"
              >
                {T.finish}
              </button>
            ) : (
              <button
                onClick={() => goToStop(stopIndex + 1)}
                className="flex items-center gap-1 text-xs font-semibold text-gold-400 hover:text-gold-300 transition-colors"
              >
                {T.next} <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Auto-advance toggle */}
          <div className="mt-3 flex items-center justify-center">
            <button
              onClick={() => setAutoAdvance((v) => !v)}
              className={`text-[10px] tracking-wider uppercase transition-colors ${
                autoAdvance ? 'text-gold-400/60' : 'text-white/25'
              }`}
            >
              {autoAdvance ? '● ' : '○ '}{T.auto}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Onboarding: account/email capture from stop 2 (anonymous visitors) */}
      <AnimatePresence>
        {showOnboard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center px-4"
            style={{ background: 'rgba(5,6,13,0.8)', backdropFilter: 'blur(6px)' }}
          >
            <motion.div
              initial={{ scale: 0.94, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl border border-amber-400/25 bg-gradient-to-b from-[#0f1120] to-[#05060d] p-6 shadow-[0_0_60px_-15px_rgba(251,191,36,0.5)]"
            >
              {obSaved ? (
                <div className="text-center py-6">
                  <Sparkles className="w-10 h-10 text-amber-300 mx-auto mb-3" />
                  <p className="text-lg font-semibold text-white">{T.saved}</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <h3 className="font-serif text-xl font-semibold text-white">{T.obTitle}</h3>
                  </div>
                  <p className="text-sm text-amber-300/90 font-medium mb-1">{T.obXp(xp)}</p>
                  <p className="text-xs text-white/60 leading-relaxed mb-4">{T.obBody}</p>

                  <form onSubmit={submitOnboard} className="space-y-2.5">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                      <input
                        type="email"
                        value={obEmail}
                        onChange={(e) => setObEmail(e.target.value)}
                        placeholder={T.email}
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white/90 placeholder-white/25 focus:outline-none focus:border-amber-400/40"
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                      <input
                        type="password"
                        value={obPass}
                        onChange={(e) => setObPass(e.target.value)}
                        placeholder={T.pass}
                        required
                        minLength={6}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white/90 placeholder-white/25 focus:outline-none focus:border-amber-400/40"
                      />
                    </div>
                    {obError && <p className="text-xs text-red-400/80 text-center">{obError}</p>}
                    <button
                      type="submit"
                      disabled={obLoading}
                      className="w-full py-3 rounded-xl bg-amber-400 text-midnight-950 font-semibold text-sm hover:bg-amber-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {obLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {T.create}
                    </button>
                  </form>
                  <button
                    onClick={skipOnboard}
                    className="mt-3 w-full text-center text-[11px] text-white/40 hover:text-white/70 transition-colors"
                  >
                    {T.later}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
