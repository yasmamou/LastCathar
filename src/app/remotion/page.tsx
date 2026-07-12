'use client'

import { useMemo, useState, useEffect, useRef, useCallback, type ComponentType } from 'react'
import { Player } from '@remotion/player'
import { Search, Film, Download, Instagram, Sparkles, Loader2, Video, AlertTriangle } from 'lucide-react'
import { allPlaces } from '@/data/all-places'
import {
  CityReel,
  CITY_REEL_FPS,
  CITY_REEL_DURATION,
  CITY_REEL_W,
  CITY_REEL_H,
} from '../../../remotion/CityReel'

type RenderState = 'idle' | 'rendering' | 'done' | 'error' | 'unavailable'

export default function RemotionStudioPage() {
  const [query, setQuery] = useState('')
  const [slug, setSlug] = useState('cite-de-carcassonne')
  const [reelLang, setReelLang] = useState<'fr' | 'en'>('fr')

  // Cette page doit défiler (le body est en overflow:hidden pour le globe).
  useEffect(() => {
    document.body.classList.add('scrollable-page')
    return () => document.body.classList.remove('scrollable-page')
  }, [])

  // ─── Rendu MP4 (déclenché ici, en local) ───
  const [render, setRender] = useState<RenderState>('idle')
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [renderErr, setRenderErr] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopTimers = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    pollRef.current = null
    timerRef.current = null
  }, [])

  // Reset when the city or language changes
  useEffect(() => {
    stopTimers()
    setRender('idle')
    setVideoUrl(null)
    setRenderErr('')
    setElapsed(0)
  }, [slug, reelLang, stopTimers])

  useEffect(() => () => stopTimers(), [stopTimers])

  const generate = useCallback(async () => {
    setRenderErr('')
    setVideoUrl(null)
    setElapsed(0)
    setRender('rendering')
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    try {
      const res = await fetch('/api/render-reel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, lang: reelLang }),
      })
      if (res.status === 501) {
        stopTimers(); setRender('unavailable'); return
      }
      const data = await res.json()
      if (data.status === 'done' && data.url) {
        stopTimers(); setVideoUrl(data.url); setRender('done'); return
      }
      // Poll for completion
      pollRef.current = setInterval(async () => {
        try {
          const r = await fetch(`/api/render-reel?slug=${slug}&lang=${reelLang}`)
          const d = await r.json()
          if (d.status === 'done' && d.url) { stopTimers(); setVideoUrl(d.url); setRender('done') }
          else if (d.status === 'error') { stopTimers(); setRenderErr(d.error || 'Échec du rendu'); setRender('error') }
        } catch { /* keep polling */ }
      }, 2500)
    } catch {
      stopTimers(); setRenderErr('Erreur réseau'); setRender('error')
    }
  }, [slug, reelLang, stopTimers])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      // Quelques lieux emblématiques par défaut
      const featured = allPlaces.filter((p) => p.isFeatured).slice(0, 40)
      return featured.length ? featured : allPlaces.slice(0, 40)
    }
    return allPlaces
      .filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.country?.toLowerCase().includes(q) ||
          p.slug.includes(q),
      )
      .slice(0, 60)
  }, [query])

  const place = allPlaces.find((p) => p.slug === slug) ?? allPlaces[0]

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#05060d] via-[#0a0d1a] to-[#05060d] text-white">
      <div className="mx-auto max-w-6xl px-5 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gold-400 text-midnight-950 flex items-center justify-center">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold">Générateur de Reels — Last Cathar</h1>
            <p className="text-sm text-white/50">
              Choisissez une ville : la vidéo verticale (Instagram / TikTok) se génère avec la carte, l&apos;histoire et les sous-titres.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-8 text-[11px]">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-white/60">
            <Instagram className="w-3 h-3" /> 1080 × 1920 · 9:16
          </span>
          <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-white/60">
            {CITY_REEL_DURATION}s · {CITY_REEL_FPS} fps
          </span>
          <span className="rounded-full bg-gold-400/10 border border-gold-400/25 px-2.5 py-1 text-gold-300">
            {allPlaces.length} lieux disponibles
          </span>
        </div>

        <div className="flex flex-col-reverse md:grid md:grid-cols-[1fr_auto] gap-8 items-start">
          {/* Picker */}
          <div className="w-full">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher une ville (Carcassonne, Petra, Rome…)"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/90 placeholder-white/25 focus:outline-none focus:border-gold-400/40"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:max-h-[560px] md:overflow-y-auto pr-1">
              {results.map((p) => (
                <button
                  key={p.slug}
                  onClick={() => setSlug(p.slug)}
                  className={`text-left rounded-lg border p-2.5 transition-colors ${
                    p.slug === slug
                      ? 'border-gold-400/60 bg-gold-400/10'
                      : 'border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div className="text-[12px] font-medium text-white/85 truncate">{p.title}</div>
                  <div className="text-[10px] text-white/40 truncate">{p.country}</div>
                </button>
              ))}
            </div>

            {/* Générer la vidéo (rendu déclenché en local) */}
            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-white/80 mb-3">
                <Video className="w-4 h-4 text-gold-400/70" /> Générer la vidéo (MP4)
              </div>

              {render !== 'done' && (
                <button
                  onClick={generate}
                  disabled={render === 'rendering'}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gold-400 text-midnight-950 font-semibold text-sm hover:bg-gold-300 transition-colors disabled:opacity-60"
                >
                  {render === 'rendering' ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Génération… {elapsed}s</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Générer la vidéo</>
                  )}
                </button>
              )}

              {render === 'rendering' && (
                <p className="text-[11px] text-white/40 text-center mt-2">
                  Le rendu tourne sur le serveur local (≈ 1 à 2 min). Ne fermez pas cette page.
                </p>
              )}

              {render === 'done' && videoUrl && (
                <div className="space-y-3">
                  <video src={videoUrl} controls playsInline className="w-full rounded-lg border border-white/10" />
                  <a
                    href={videoUrl}
                    download={`last-cathar-${slug}.mp4`}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-400 transition-colors"
                  >
                    <Download className="w-4 h-4" /> Télécharger la vidéo
                  </a>
                  <button onClick={generate} className="w-full text-center text-[11px] text-white/40 hover:text-white/70">
                    Régénérer
                  </button>
                </div>
              )}

              {render === 'error' && (
                <div className="mt-2 text-xs text-red-400/80">
                  <div className="flex items-center gap-1.5 mb-1"><AlertTriangle className="w-3.5 h-3.5" /> Échec du rendu</div>
                  <p className="text-white/40 text-[11px] break-words">{renderErr}</p>
                  <button onClick={generate} className="mt-2 text-gold-300 text-[11px]">Réessayer</button>
                </div>
              )}

              {render === 'unavailable' && (
                <div className="mt-2 text-[11px] text-white/50 leading-relaxed">
                  Le rendu doit tourner sur le générateur <b>local</b> (pas sur le site hébergé).
                  En local : <code className="text-gold-300">npm run reel -- {slug}</code>
                </div>
              )}
            </div>
          </div>

          {/* Player + langue de la voix */}
          <div className="w-full md:w-auto flex flex-col items-center">
            {/* Langue de la narration (mêmes voix que les audioguides) */}
            <div className="mb-3 inline-flex items-center rounded-full bg-white/5 border border-white/15 overflow-hidden text-xs font-semibold">
              {(['fr', 'en'] as const).map((code) => (
                <button
                  key={code}
                  onClick={() => setReelLang(code)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 transition-colors ${
                    reelLang === code ? 'bg-gold-400 text-midnight-950' : 'text-white/55 hover:text-white/90'
                  }`}
                >
                  <span>{code === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
                  {code === 'fr' ? 'Voix FR' : 'Voice EN'}
                </button>
              ))}
            </div>

            <div className="rounded-[28px] overflow-hidden border border-white/10 shadow-2xl" style={{ width: 300, maxWidth: '85vw' }}>
              <Player
                key={`${slug}-${reelLang}`}
                component={CityReel as unknown as ComponentType<Record<string, unknown>>}
                inputProps={{ placeSlug: slug, lang: reelLang }}
                durationInFrames={CITY_REEL_FPS * CITY_REEL_DURATION}
                fps={CITY_REEL_FPS}
                compositionWidth={CITY_REEL_W}
                compositionHeight={CITY_REEL_H}
                style={{ width: '100%', aspectRatio: `${CITY_REEL_W} / ${CITY_REEL_H}` }}
                controls
                loop
                autoPlay
              />
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-white/50 text-center">
              <Sparkles className="w-3.5 h-3.5 text-gold-400/60" />
              {place.title} · {place.country}
            </div>
            <p className="mt-1 text-[10px] text-white/30 text-center max-w-[280px]">
              L&apos;aperçu est muet ; la voix ({reelLang === 'fr' ? 'française' : 'anglaise'}) est ajoutée dans la vidéo finale.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
