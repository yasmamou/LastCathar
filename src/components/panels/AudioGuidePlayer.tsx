'use client'

import { useEffect, useRef, useState } from 'react'
import { Headphones, Play, Pause, RotateCcw, FileText, ChevronUp } from 'lucide-react'
import { getAudioGuide, type GuideLang } from '@/data/audio-guides'
import { useLang } from '@/lib/lang'
import { useAudioGate } from '@/lib/audio-gate'
import { AudioPaywall } from '@/components/audio/AudioPaywall'

interface Props {
  placeSlug: string
  onOpenAuth?: () => void
}

const LABELS = {
  fr: { badge: 'Guide audio', show: 'Lire les paroles', hide: 'Masquer les paroles', play: 'Écouter le guide audio', pause: 'Mettre le guide en pause', restart: 'Recommencer le guide' },
  en: { badge: 'Audio guide', show: 'Read the transcript', hide: 'Hide the transcript', play: 'Play the audio guide', pause: 'Pause the audio guide', restart: 'Restart the guide' },
} as const

function fmt(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Notify the ambient music player so it ducks its volume during narration.
function emitGuideState(playing: boolean) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('audioguide:state', { detail: { playing } }))
  }
}

export function AudioGuidePlayer({ placeSlug, onOpenAuth }: Props) {
  const guide = getAudioGuide(placeSlug)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [lang, setLang] = useLang()
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showTranscript, setShowTranscript] = useState(false)
  const { canPlay, registerPlay } = useAudioGate()
  const [showPaywall, setShowPaywall] = useState(false)

  const track = guide?.langs[lang]
  const gateKey = `guide:${placeSlug}`

  // (Re)create the audio element when the place OR the language changes
  useEffect(() => {
    if (!track) return
    const audio = new Audio(track.file)
    audio.preload = 'none'
    audioRef.current = audio

    const onTime = () => setProgress(audio.currentTime)
    const onMeta = () => setDuration(audio.duration || track.duration)
    const onEnded = () => {
      setPlaying(false)
      setProgress(0)
      emitGuideState(false)
    }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('ended', onEnded)

    setPlaying(false)
    setProgress(0)
    setDuration(track.duration)

    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('ended', onEnded)
      audio.pause()
      audio.src = ''
      emitGuideState(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeSlug, lang])

  // Reset the transcript panel when navigating to a new place
  useEffect(() => {
    setShowTranscript(false)
  }, [placeSlug])

  if (!guide || !track) return null

  const L = LABELS[lang]

  const switchLang = (next: GuideLang) => {
    if (next === lang) return
    // Stop current playback before swapping the source (effect will rebuild it)
    audioRef.current?.pause()
    setPlaying(false)
    emitGuideState(false)
    setLang(next)
  }

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
      emitGuideState(false)
    } else {
      // Paywall : au-delà des guides gratuits, demander le Pass Audioguides.
      if (!canPlay(gateKey)) {
        // Mémorise le lieu pour y revenir après le paiement.
        if (typeof window !== 'undefined') {
          localStorage.setItem('audio:resume', JSON.stringify({ placeSlug, tour: false }))
        }
        setShowPaywall(true)
        return
      }
      registerPlay(gateKey)
      audio.play().then(() => {
        setPlaying(true)
        emitGuideState(true)
      }).catch(() => {})
    }
  }

  const restart = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = 0
    setProgress(0)
    if (!playing) toggle()
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const r = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    audio.currentTime = r * duration
    setProgress(audio.currentTime)
  }

  const ratio = duration > 0 ? progress / duration : 0

  return (
    <div className="mx-6 mb-4 rounded-xl border border-gold-400/20 bg-gradient-to-r from-gold-400/10 to-transparent p-3">
      <AudioPaywall
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        onNeedAuth={() => { setShowPaywall(false); onOpenAuth?.() }}
      />
      <div className="flex items-center gap-3">
        {/* Play / pause */}
        <button
          onClick={toggle}
          aria-label={playing ? L.pause : L.play}
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            playing
              ? 'bg-gold-400 text-midnight-950 shadow-lg shadow-gold-400/20'
              : 'bg-gold-400/15 text-gold-400 hover:bg-gold-400/25'
          }`}
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[9px] tracking-widest uppercase text-gold-400/60 font-semibold">
              <Headphones className="w-3 h-3" />
              {L.badge}
            </div>
            {/* Language switch FR / EN */}
            <div className="flex items-center rounded-full bg-black/30 border border-white/10 overflow-hidden text-[9px] font-semibold">
              {(['fr', 'en'] as const).map((code) => (
                <button
                  key={code}
                  onClick={() => switchLang(code)}
                  aria-pressed={lang === code}
                  className={`px-2 py-0.5 uppercase tracking-wider transition-colors ${
                    lang === code
                      ? 'bg-gold-400 text-midnight-950'
                      : 'text-white/45 hover:text-white/80'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-white/85 font-medium truncate mt-0.5">{track.title}</p>

          {/* Progress bar */}
          <div
            onClick={seek}
            className="mt-1.5 h-1.5 rounded-full bg-white/10 cursor-pointer group"
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
        </div>

        <div className="flex-shrink-0 flex flex-col items-end gap-1">
          <span className="text-[10px] text-white/40 tabular-nums">
            {fmt(progress)} / {fmt(duration)}
          </span>
          <button
            onClick={restart}
            aria-label={L.restart}
            className="text-white/25 hover:text-gold-400/70 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Paroles / transcription de la narration */}
      <button
        onClick={() => setShowTranscript(!showTranscript)}
        className="mt-2 flex items-center gap-1.5 text-[10px] tracking-wider uppercase text-gold-400/50 hover:text-gold-400/90 transition-colors"
        aria-expanded={showTranscript}
      >
        {showTranscript ? <ChevronUp className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
        {showTranscript ? L.hide : L.show}
      </button>

      {showTranscript && (
        <div className="mt-2 max-h-48 overflow-y-auto rounded-lg bg-black/30 border border-white/5 px-3 py-2.5">
          {track.transcript.split('\n\n').map((para, i) => (
            <p key={i} className="text-xs text-white/60 leading-relaxed mb-2 last:mb-0">
              {para}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
