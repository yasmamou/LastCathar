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
  // True when a detail panel covers the screen — hides the player on mobile
  // (the panel is full-screen there) instead of floating on top of its content.
  panelOpen?: boolean
}

export function AmbientMusic({ selectedCountry, selectedEras = [], placeSlug, panelOpen }: AmbientMusicProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [showPanel, setShowPanel] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<MusicTrack>(MUSIC_LIBRARY.find(t => t.id === 'gregorian') ?? MUSIC_LIBRARY[0])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const autoStartedRef = useRef(false)
  // Guards the place/country effect while a track cross-fade is in progress.
  const fadingRef = useRef(false)
  // Does the USER want music on? (true after auto-start, false after they pause).
  // Effective sound = wantMusic && !ducked.
  const wantMusicRef = useRef(false)
  // True while an audio-guide / tour narration is playing → music is FORCED
  // silent (paused immediately, no fade) so the voice is never overlaid.
  const duckedRef = useRef(false)
  // The single fade timer. EVERY volume ramp goes through this ref and clears any
  // previous one first, so two fades can never fight each other (that tug-of-war
  // was the cause of the 4-5 s lag and the music bleeding under the narration).
  const fadeRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const FULL_VOL = 0.25

  const clearFade = useCallback(() => {
    if (fadeRef.current) { clearInterval(fadeRef.current); fadeRef.current = null }
  }, [])

  // Ramp the volume to `target` over ~ms; cancels any fade already running.
  const fadeTo = useCallback((target: number, ms = 500, pauseAtEnd = false) => {
    const audio = audioRef.current
    if (!audio) return
    clearFade()
    const stepMs = 25
    const steps = Math.max(1, Math.round(ms / stepMs))
    const delta = (target - audio.volume) / steps
    fadeRef.current = setInterval(() => {
      const next = audio.volume + delta
      const done = delta >= 0 ? next >= target : next <= target
      audio.volume = Math.min(1, Math.max(0, done ? target : next))
      if (done) {
        clearFade()
        if (pauseAtEnd && target <= 0) audio.pause()
      }
    }, stepMs)
  }, [clearFade])

  // Kill the sound RIGHT NOW (no fade): cancel any fade, pause, volume 0.
  const killAudio = useCallback(() => {
    clearFade()
    fadingRef.current = false
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    audio.volume = 0
  }, [clearFade])

  // When an audio guide / tour narrates, the ambient music is silenced INSTANTLY
  // (hard pause, no fade) so the voice is never overlaid, and resumed when the
  // narration ends. Event from AudioGuidePlayer / CarcassonneTour.
  useEffect(() => {
    const onGuideState = (e: Event) => {
      const playing = (e as CustomEvent<{ playing: boolean }>).detail?.playing
      duckedRef.current = !!playing
      if (playing) {
        // Narration started → cut the music immediately.
        killAudio()
      } else if (wantMusicRef.current) {
        // Narration ended → resume only if the user still wants music.
        const audio = audioRef.current
        if (audio) audio.play().then(() => fadeTo(FULL_VOL, 600)).catch(() => {})
      }
    }
    window.addEventListener('audioguide:state', onGuideState)
    return () => window.removeEventListener('audioguide:state', onGuideState)
  }, [killAudio, fadeTo])

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
      wantMusicRef.current = true
      setHasInteracted(true)
      setIsPlaying(true)
      // If a narration is already playing (e.g. the first tap WAS "Entrer dans la
      // Cité"), stay silent — the music will start when the narration ends.
      if (duckedRef.current) {
        document.removeEventListener('click', startOnInteraction)
        document.removeEventListener('touchstart', startOnInteraction)
        return
      }
      audio.play().then(() => fadeTo(FULL_VOL, 800)).catch(() => {})
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

  // Play a track immediately (used on place select / from the tracklist).
  const playTrackDirect = useCallback((track: MusicTrack) => {
    const audio = audioRef.current
    if (!audio) return
    wantMusicRef.current = true
    clearFade()
    audio.src = track.file
    audio.load()
    if (track.startAt) audio.currentTime = track.startAt
    audio.volume = 0
    setCurrentTrack(track)
    setIsPlaying(true)
    setHasInteracted(true)
    // Narration active → load the track but keep it silent; it resumes after.
    if (duckedRef.current) return
    audio.play().then(() => fadeTo(FULL_VOL, 600)).catch(() => {})
  }, [clearFade, fadeTo])

  // Cross-fade to another track (used when music is already playing).
  const switchTrack = useCallback((track: MusicTrack) => {
    const audio = audioRef.current
    if (!audio) return
    wantMusicRef.current = true
    setCurrentTrack(track)

    // Narration active → just swap the source silently, no volume changes.
    if (duckedRef.current) {
      audio.src = track.file
      audio.load()
      if (track.startAt) audio.currentTime = track.startAt
      return
    }

    fadingRef.current = true
    fadeTo(0, 250, true)
    // After the fade-out timer finishes, swap + fade back in.
    const swap = setInterval(() => {
      if (fadeRef.current) return // fade-out still running
      clearInterval(swap)
      audio.src = track.file
      audio.load()
      if (track.startAt) audio.currentTime = track.startAt
      audio.volume = 0
      if (duckedRef.current) { fadingRef.current = false; return }
      audio.play()
        .then(() => { setIsPlaying(true); fadeTo(FULL_VOL, 500); fadingRef.current = false })
        .catch(() => { fadingRef.current = false })
    }, 30)
  }, [fadeTo])

  const playTrack = useCallback((track: MusicTrack) => {
    const audio = audioRef.current
    if (!audio) return
    if (wantMusicRef.current && isPlaying && track.id !== currentTrack.id) {
      switchTrack(track)
      return
    }
    playTrackDirect(track)
  }, [currentTrack, isPlaying, switchTrack, playTrackDirect])

  // Auto-switch track when country/place changes (never restarts if the user
  // paused, never plays over a narration).
  useEffect(() => {
    if (fadingRef.current) return
    const placeTrack = getTrackForPlace(placeSlug)
    const region = getRegionFromCountry(selectedCountry)
    const best = placeTrack ?? getBestTrackForEra(region, selectedEras)
    if (best.id === currentTrack.id) return

    const audio = audioRef.current
    // No interaction yet, or narration playing → just prime the src silently.
    if (!autoStartedRef.current || duckedRef.current) {
      if (audio) {
        audio.src = best.file
        audio.load()
        if (best.startAt) audio.currentTime = best.startAt
        setCurrentTrack(best)
      }
      return
    }
    // Music on → cross-fade to the new track. Music off (user paused) → do nothing.
    if (wantMusicRef.current) switchTrack(best)
  }, [selectedCountry, selectedEras, placeSlug]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (!isPlaying) {
      wantMusicRef.current = true
      setIsPlaying(true)
      playTrack(currentTrack)
    } else {
      // Turn OFF — immediate, no fade.
      wantMusicRef.current = false
      setIsPlaying(false)
      killAudio()
    }
  }, [isPlaying, currentTrack, playTrack, killAudio])

  const region = getRegionFromCountry(selectedCountry)
  const regionTracks = getTracksForRegion(region)

  return (
    <>
      {/* ── Player button — fixed bottom-left, above the featured strip.
             (The old center-left spot collided with the vitrine column when a
             panel was open, and floated over the full-screen panel on mobile.) ── */}
      {/* Always visible so the music can be stopped at any time — even with a
          place panel open on mobile (moves to the bottom-left corner there). */}
      <div className={`fixed left-2 md:left-3 z-[60] pointer-events-auto flex flex-row items-center gap-2 md:bottom-40 ${panelOpen ? 'bottom-4' : 'bottom-[11.5rem]'}`}>
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
            className="fixed left-2 bottom-[15rem] md:left-64 md:bottom-40 z-[60] w-72 sm:w-80 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl bg-black/85 border border-white/10 max-h-[55vh] flex flex-col pointer-events-auto"
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
