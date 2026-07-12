'use client'

import { useMemo, useState } from 'react'
import { Player } from '@remotion/player'
import { Search, Film, Download, Instagram, Sparkles } from 'lucide-react'
import { allPlaces } from '@/data/all-places'
import {
  CityReel,
  CITY_REEL_FPS,
  CITY_REEL_DURATION,
  CITY_REEL_W,
  CITY_REEL_H,
} from '../../../remotion/CityReel'

export default function RemotionStudioPage() {
  const [query, setQuery] = useState('')
  const [slug, setSlug] = useState('cite-de-carcassonne')

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

        <div className="grid md:grid-cols-[1fr_auto] gap-8">
          {/* Left: picker */}
          <div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher une ville (Carcassonne, Petra, Rome…)"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/90 placeholder-white/25 focus:outline-none focus:border-gold-400/40"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[560px] overflow-y-auto pr-1">
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

            {/* Export help */}
            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
                <Download className="w-4 h-4 text-gold-400/70" /> Exporter la vidéo (MP4)
              </div>
              <p className="text-xs text-white/50 leading-relaxed mb-2">
                Aperçu en direct ci-contre. Pour générer le fichier MP4 prêt à publier :
              </p>
              <code className="block text-[11px] bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-gold-300">
                npm run reel -- {slug}
              </code>
              <p className="text-[11px] text-white/35 leading-relaxed mt-2">
                Pour ajuster librement (textes, durée, effets) : <code className="text-white/55">npm run remotion:studio</code> ouvre le studio Remotion.
              </p>
            </div>
          </div>

          {/* Right: player */}
          <div className="flex flex-col items-center">
            <div className="rounded-[28px] overflow-hidden border border-white/10 shadow-2xl" style={{ width: 320 }}>
              <Player
                key={slug}
                component={CityReel}
                inputProps={{ placeSlug: slug }}
                durationInFrames={CITY_REEL_FPS * CITY_REEL_DURATION}
                fps={CITY_REEL_FPS}
                compositionWidth={CITY_REEL_W}
                compositionHeight={CITY_REEL_H}
                style={{ width: 320, height: (320 * CITY_REEL_H) / CITY_REEL_W }}
                controls
                loop
                autoPlay
              />
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-white/50">
              <Sparkles className="w-3.5 h-3.5 text-gold-400/60" />
              {place.title} · {place.country}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
