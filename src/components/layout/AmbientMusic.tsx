'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Volume2, VolumeX, Music, ExternalLink, ChevronUp, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MusicTrack,
  getRegionFromCountry,
  getTracksForRegion,
  getBestTrackForEra,
  MUSIC_LIBRARY,
} from '@/lib/music'

interface AmbientMusicProps {
  selectedCountry?: string
  selectedEras?: string[]
}

export function AmbientMusic({ selectedCountry, selectedEras = [] }: AmbientMusicProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [showPanel, setShowPanel] = useState(false) // Closed by default, especially on mobile
  const [currentTrack, setCurrentTrack] = useState<MusicTrack>(MUSIC_LIBRARY[1]) // Gloria default
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const autoStartedRef = useRef(false)
  const playingRef = useRef(false)
  const fadingRef = useRef(false)

  useEffect(() => {
    const audio = new Audio(currentTrack.file)
    audio.loop = true
    audio.volume = 0
    audio.preload = 'auto'
    audioRef.current = audio

    // Auto-start music on first user interaction with the page
    const startOnInteraction = () => {
      if (autoStartedRef.current) return
      autoStartedRef.current = true
      audio.play().then(() => {
        let vol = 0
        const timer = setInterval(() => {
          vol = Math.min(0.25, vol + 0.005)
          audio.volume = vol
          if (vol >= 0.25) clearInterval(timer)
        }, 80)
        setIsPlaying(true)
        playingRef.current = true
        setHasInteracted(true)
      }).catch(() => {})
      document.removeEventListener('click', startOnInteraction)
      document.removeEventListener('touchstart', startOnInteraction)
    }
    document.addEventListener('click', startOnInteraction)
    document.addEventListener('touchstart', startOnInteraction)

    return () => {
      audio.pause(); audio.src = ''
      document.removeEventListener('click', startOnInteraction)
      document.removeEventListener('touchstart', startOnInteraction)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-switch track when country changes
  useEffect(() => {
    if (!playingRef.current || fadingRef.current) return
    const region = getRegionFromCountry(selectedCountry)
    const best = getBestTrackForEra(region, selectedEras)
    if (best.id === currentTrack.id) return
    switchTrack(best)
  }, [selectedCountry, selectedEras]) // eslint-disable-line react-hooks/exhaustive-deps

  const switchTrack = useCallback((track: MusicTrack) => {
    const audio = audioRef.current
    if (!audio) return
    fadingRef.current = true

    // Fade out
    let vol = audio.volume
    const out = setInterval(() => {
      vol = Math.max(0, vol - 0.015)
      audio.volume = vol
      if (vol <= 0) {
        clearInterval(out)
        audio.pause()
        audio.src = track.file
        audio.load()
        setCurrentTrack(track)
        if (playingRef.current) {
          audio.play().then(() => {
            let v = 0
            const inp = setInterval(() => {
              v = Math.min(0.25, v + 0.008)
              audio.volume = v
              if (v >= 0.25) { clearInterval(inp); fadingRef.current = false }
            }, 60)
          }).catch(() => { fadingRef.current = false })
        } else {
          fadingRef.current = false
        }
      }
    }, 40)
  }, [])

  const playTrack = useCallback((track: MusicTrack) => {
    const audio = audioRef.current
    if (!audio) return

    if (playingRef.current && track.id !== currentTrack.id) {
      switchTrack(track)
      return
    }

    audio.src = track.file
    audio.load()
    audio.volume = 0
    setCurrentTrack(track)
    audio.play().then(() => {
      let vol = 0
      const timer = setInterval(() => {
        vol = Math.min(0.25, vol + 0.008)
        audio.volume = vol
        if (vol >= 0.25) clearInterval(timer)
      }, 80)
    }).catch(() => {})
    setIsPlaying(true)
    playingRef.current = true
    setHasInteracted(true)
  }, [currentTrack, switchTrack])

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    if (!isPlaying) {
      playTrack(currentTrack)
    } else {
      let vol = audio.volume
      const timer = setInterval(() => {
        vol = Math.max(0, vol - 0.02)
        audio.volume = vol
        if (vol <= 0) { audio.pause(); clearInterval(timer) }
      }, 40)
      setIsPlaying(false)
      playingRef.current = false
    }
  }, [isPlaying, currentTrack, playTrack])

  const region = getRegionFromCountry(selectedCountry)
  const regionTracks = getTracksForRegion(region)

  return (
    <div className="relative pointer-events-auto">
      {/* Toggle button */}
      <button
        onClick={toggleMusic}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-light text-white/30 hover:text-white/60 transition-all duration-300"
      >
        {isPlaying ? (
          <Volume2 className="w-3.5 h-3.5 text-gold-400/60" />
        ) : (
          <VolumeX className="w-3.5 h-3.5" />
        )}
        {!hasInteracted ? (
          <span className="text-[9px] tracking-wider uppercase text-gold-400/40 animate-pulse">Music</span>
        ) : isPlaying ? (
          <span className="text-[9px] tracking-wider uppercase text-gold-400/30 max-w-[80px] truncate">
            {currentTrack.title.split('(')[0].trim()}
          </span>
        ) : null}
      </button>

      {/* Expand/collapse panel button */}
      {hasInteracted && (
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full glass-light flex items-center justify-center text-white/20 hover:text-white/40 transition-colors"
        >
          {showPanel ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
        </button>
      )}

      {/* Music panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full mb-2 left-0 w-60 md:w-72 glass rounded-xl overflow-hidden shadow-2xl z-50 max-h-[50vh] overflow-y-auto"
          >
            {/* Now playing */}
            {isPlaying && (
              <div className="px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <Music className="w-3 h-3 text-gold-400/50" />
                  <span className="text-[9px] tracking-wider uppercase text-gold-400/40">En écoute</span>
                </div>
                <p className="text-sm text-white/80 font-medium">{currentTrack.title}</p>
                <p className="text-[10px] text-white/30">{currentTrack.artist}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-gold-400/10 text-gold-400/50">
                    {currentTrack.era}
                  </span>
                  <span className="text-[9px] text-white/20">{currentTrack.year}</span>
                  <a
                    href={currentTrack.wiki}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] text-gold-400/30 hover:text-gold-400/60 transition-colors ml-auto flex items-center gap-0.5"
                  >
                    <ExternalLink className="w-2.5 h-2.5" />
                    Wiki
                  </a>
                </div>
                <p className="text-[9px] text-white/25 leading-relaxed mt-2 italic">
                  {currentTrack.context}
                </p>
              </div>
            )}

            {/* Track list for current region */}
            <div className="px-3 py-2">
              <p className="text-[9px] tracking-wider uppercase text-white/20 mb-1.5 px-1">
                {region === 'france' ? 'France' : region === 'maghreb' ? 'Méditerranée antique' : region === 'spain' ? 'Espagne' : 'Italie'}
                {' '}&middot; {regionTracks.length} pistes
              </p>
              {regionTracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => playTrack(track)}
                  className={`w-full text-left px-2 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                    currentTrack.id === track.id && isPlaying
                      ? 'bg-gold-400/10 text-white/80'
                      : 'text-white/40 hover:bg-white/5 hover:text-white/60'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    currentTrack.id === track.id && isPlaying ? 'bg-gold-400/60 animate-pulse' : 'bg-white/10'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] truncate">{track.title}</p>
                    <p className="text-[9px] text-white/20">{track.year} &middot; {track.era}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Attribution */}
            <div className="px-4 py-2 border-t border-white/5">
              <p className="text-[8px] text-white/15 italic">
                Sources: Wikimedia Commons &middot; Internet Archive &middot; Domaine public
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
