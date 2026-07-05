'use client'

import { useEffect, useRef, useState } from 'react'
import { Headphones, Play, Pause, RotateCcw } from 'lucide-react'
import { getAudioGuide } from '@/data/audio-guides'

interface Props {
  placeSlug: string
}

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

export function AudioGuidePlayer({ placeSlug }: Props) {
  const guide = getAudioGuide(placeSlug)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(guide?.duration ?? 0)

  // (Re)create the audio element when the place changes
  useEffect(() => {
    if (!guide) return
    const audio = new Audio(guide.file)
    audio.preload = 'none'
    audioRef.current = audio

    const onTime = () => setProgress(audio.currentTime)
    const onMeta = () => setDuration(audio.duration || guide.duration)
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
    setDuration(guide.duration)

    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('ended', onEnded)
      audio.pause()
      audio.src = ''
      emitGuideState(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeSlug])

  if (!guide) return null

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
      emitGuideState(false)
    } else {
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
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    audio.currentTime = ratio * duration
    setProgress(audio.currentTime)
  }

  const ratio = duration > 0 ? progress / duration : 0

  return (
    <div className="mx-6 mb-4 rounded-xl border border-gold-400/20 bg-gradient-to-r from-gold-400/10 to-transparent p-3">
      <div className="flex items-center gap-3">
        {/* Play / pause */}
        <button
          onClick={toggle}
          aria-label={playing ? 'Mettre le guide en pause' : 'Écouter le guide audio'}
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            playing
              ? 'bg-gold-400 text-midnight-950 shadow-lg shadow-gold-400/20'
              : 'bg-gold-400/15 text-gold-400 hover:bg-gold-400/25'
          }`}
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[9px] tracking-widest uppercase text-gold-400/60 font-semibold">
            <Headphones className="w-3 h-3" />
            Guide audio
          </div>
          <p className="text-xs text-white/85 font-medium truncate mt-0.5">{guide.title}</p>

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
            aria-label="Recommencer le guide"
            className="text-white/25 hover:text-gold-400/70 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}
