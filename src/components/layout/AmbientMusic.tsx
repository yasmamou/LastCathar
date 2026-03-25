'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Volume2, VolumeX, Music, ExternalLink, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MusicTrack,
  getRegionFromCountry,
  getTracksForRegion,
  getBestTrackForEra,
  getTrackForPlace,
  MUSIC_LIBRARY,
} from '@/lib/music'

interface AmbientMusicProps {
  selectedCountry?: string
  selectedEras?: string[]
  placeSlug?: string
}

export function AmbientMusic({ selectedCountry, selectedEras = [], placeSlug }: AmbientMusicProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [showPanel, setShowPanel] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<MusicTrack>(MUSIC_LIBRARY.find(t => t.id === 'gregorian') ?? MUSIC_LIBRARY[0])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const autoStartedRef = useRef(false)
  const playingRef = useRef(false)
  const fadingRef = useRef(false)

  // Init audio + auto-start on first user interaction
  useEffect(() => {
    const audio = new Audio(currentTrack.file)
    audio.loop = true
    audio.volume = 0
    audio.preload = 'auto'
    audioRef.current = audio

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

  // Auto-switch track when country/place changes
  // If a place-specific track exists, auto-start even if not yet playing
  useEffect(() => {
    if (fadingRef.current) return
    const placeTrack = getTrackForPlace(placeSlug)
    const region = getRegionFromCountry(selectedCountry)
    const best = placeTrack ?? getBestTrackForEra(region, selectedEras)

    // If we have a place-specific track and music isn't playing yet, auto-start it
    if (placeTrack && !playingRef.current && autoStartedRef.current) {
      playTrackDirect(placeTrack)
      return
    }

    if (!playingRef.current) return
    if (best.id === currentTrack.id) return
    switchTrack(best)
  }, [selectedCountry, selectedEras, placeSlug]) // eslint-disable-line react-hooks/exhaustive-deps

  // Direct play (no fade, used for auto-start on place select)
  const playTrackDirect = useCallback((track: MusicTrack) => {
    const audio = audioRef.current
    if (!audio) return
    audio.src = track.file
    audio.load()
    if (track.startAt) audio.currentTime = track.startAt
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
  }, [])

  const switchTrack = useCallback((track: MusicTrack) => {
    const audio = audioRef.current
    if (!audio) return
    fadingRef.current = true

    let vol = audio.volume
    const out = setInterval(() => {
      vol = Math.max(0, vol - 0.015)
      audio.volume = vol
      if (vol <= 0) {
        clearInterval(out)
        audio.pause()
        audio.src = track.file
        audio.load()
        if (track.startAt) audio.currentTime = track.startAt
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

    playTrackDirect(track)
  }, [currentTrack, switchTrack, playTrackDirect])

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
    <>
      {/* ── Player button — fixed left, vertically centered ── */}
      <div className="fixed left-3 top-1/2 -translate-y-1/2 z-[60] pointer-events-auto flex flex-col items-start gap-2">
        {/* Play/Pause + track name */}
        <button
          onClick={toggleMusic}
          className={`flex items-center gap-2 pl-2.5 pr-3 py-2.5 rounded-full shadow-lg backdrop-blur-md transition-all duration-300 ${
            isPlaying
              ? 'bg-black/70 text-gold-400 border border-gold-400/30 shadow-gold-400/10'
              : 'bg-black/60 text-white/40 hover:text-white/70 border border-white/10 hover:border-white/20'
          }`}
        >
          {isPlaying ? (
            <Volume2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <VolumeX className="w-5 h-5 flex-shrink-0" />
          )}
          <span className={`text-[10px] tracking-wider uppercase max-w-[100px] truncate ${
            isPlaying ? 'text-gold-400/80' : 'text-white/40'
          }`}>
            {isPlaying ? currentTrack.title.split('(')[0].trim() : 'Music'}
          </span>
        </button>

        {/* Tracklist toggle */}
        {hasInteracted && (
          <button
            onClick={() => setShowPanel(!showPanel)}
            className={`flex items-center gap-1.5 pl-2.5 pr-3 py-2 rounded-full shadow-lg backdrop-blur-md transition-all duration-300 ${
              showPanel
                ? 'bg-gold-400/20 text-gold-400 border border-gold-400/30'
                : 'bg-black/60 text-white/40 hover:text-white/70 border border-white/10 hover:border-white/20'
            }`}
          >
            <Music className="w-4 h-4 flex-shrink-0" />
            <span className="text-[10px] tracking-wider uppercase">
              {regionTracks.length} pistes
            </span>
          </button>
        )}
      </div>

      {/* ── Music Panel — slides out from left center ── */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed left-16 top-1/2 -translate-y-1/2 z-[60] w-72 sm:w-80 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl bg-black/85 border border-white/10 max-h-[70vh] flex flex-col pointer-events-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-gold-400/60" />
                <span className="text-xs tracking-wider uppercase text-white/50 font-medium">Musiques</span>
              </div>
              <button
                onClick={() => setShowPanel(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Now playing */}
            {isPlaying && (
              <div className="px-4 py-3 border-b border-white/5 bg-gold-400/5">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-2 h-2 rounded-full bg-gold-400/60 animate-pulse" />
                  <span className="text-[9px] tracking-wider uppercase text-gold-400/50 font-medium">En écoute</span>
                </div>
                <p className="text-sm text-white/90 font-medium">{currentTrack.title}</p>
                <p className="text-[11px] text-white/40 mt-0.5">{currentTrack.artist}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-gold-400/10 text-gold-400/60 border border-gold-400/10">
                    {currentTrack.era}
                  </span>
                  {currentTrack.year && (
                    <span className="text-[9px] text-white/25">{currentTrack.year}</span>
                  )}
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
                <p className="text-[10px] text-white/30 leading-relaxed mt-2 italic">
                  {currentTrack.context}
                </p>
              </div>
            )}

            {/* Track list */}
            <div className="flex-1 overflow-y-auto px-2 py-2" style={{ WebkitOverflowScrolling: 'touch' }}>
              <p className="text-[9px] tracking-wider uppercase text-white/25 mb-1.5 px-2 font-medium">
                {region === 'france' ? 'France' : region === 'maghreb' ? 'Méditerranée antique' : region === 'spain' ? 'Espagne' : 'Italie'}
                {' '}&middot; {regionTracks.length} pistes
              </p>
              {regionTracks.map((track) => {
                const active = currentTrack.id === track.id && isPlaying
                return (
                  <button
                    key={track.id}
                    onClick={() => playTrack(track)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-3 mb-0.5 ${
                      active
                        ? 'bg-gold-400/10 border border-gold-400/15'
                        : 'text-white/40 hover:bg-white/5 hover:text-white/60 border border-transparent'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      active ? 'bg-gold-400/70 animate-pulse' : 'bg-white/15'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12px] truncate ${active ? 'text-white/90 font-medium' : ''}`}>
                        {track.title}
                      </p>
                      <p className="text-[10px] text-white/25 mt-0.5">
                        {track.artist}
                        {track.year ? ` · ${track.year}` : ''}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-white/5">
              <p className="text-[8px] text-white/15 italic text-center">
                Sources: Wikimedia Commons · Internet Archive · Domaine public
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
