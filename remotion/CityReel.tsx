import React from 'react'
import {
  AbsoluteFill,
  Audio,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from 'remotion'
import { allPlaces } from '../src/data/all-places'
import { getCategoryColor, getCategoryLabel, getCategoryIcon } from '../src/lib/categories'
import { buildReelContent } from '../src/lib/reel-content'

export const CITY_REEL_FPS = 30
export const CITY_REEL_DURATION = 22 // secondes (par défaut, sans voix)
export const CITY_REEL_W = 1080
export const CITY_REEL_H = 1920

export interface CityReelProps {
  placeSlug: string
  lang?: 'fr' | 'en'
  narrationSrc?: string // URL/staticFile de la voix (rendu final)
  durationInSeconds?: number // durée calée sur la voix (via calculateMetadata)
}

// ─── Tuiles OpenStreetMap ───
function tileUrl(z: number, x: number, y: number) {
  const s = ['a', 'b', 'c'][Math.abs(x + y) % 3]
  return `https://${s}.tile.openstreetmap.org/${z}/${x}/${y}.png`
}
function lngLatToTile(lng: number, lat: number, zoom: number) {
  const n = Math.pow(2, zoom)
  const x = ((lng + 180) / 360) * n
  const latRad = (lat * Math.PI) / 180
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  return { x, y }
}

const MapTiles: React.FC<{ lat: number; lng: number; zoom: number }> = ({ lat, lng, zoom }) => {
  const TILE = 256
  const W = CITY_REEL_W
  const H = CITY_REEL_H
  const z = Math.round(zoom)
  const center = lngLatToTile(lng, lat, z)
  const tilesX = Math.ceil(W / TILE) + 3
  const tilesY = Math.ceil(H / TILE) + 3
  const startX = Math.floor(center.x) - Math.floor(tilesX / 2)
  const startY = Math.floor(center.y) - Math.floor(tilesY / 2)
  const offX = W / 2 - (center.x - startX) * TILE
  const offY = H / 2 - (center.y - startY) * TILE
  const n = Math.pow(2, z)

  const tiles: React.ReactNode[] = []
  for (let dy = 0; dy < tilesY; dy++) {
    for (let dx = 0; dx < tilesX; dx++) {
      const tx = startX + dx
      const ty = startY + dy
      if (ty < 0 || ty >= n) continue
      const wx = ((tx % n) + n) % n
      tiles.push(
        <img
          key={`${dx}-${dy}`}
          src={tileUrl(z, wx, ty)}
          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0' }}
          style={{ position: 'absolute', left: Math.round(offX + dx * TILE), top: Math.round(offY + dy * TILE), width: TILE, height: TILE }}
        />,
      )
    }
  }
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', filter: 'brightness(0.7) saturate(0.55) contrast(1.15)' }}>
      {tiles}
    </div>
  )
}

export const CityReel: React.FC<CityReelProps> = ({ placeSlug, lang = 'fr', narrationSrc }) => {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()
  const place = allPlaces.find((p) => p.slug === placeSlug) ?? allPlaces[0]

  const color = getCategoryColor(place.categoryPrimary)
  const catLabel = getCategoryLabel(place.categoryPrimary)
  const catIcon = getCategoryIcon(place.categoryPrimary)
  const heroImage = place.heroImageUrl || place.imageUrls?.[0] || null

  // ─── Carte : zoom-in continu ("zoom zoom zoom") ───
  const baseZoom = 11
  const mapScale = interpolate(frame, [0, durationInFrames], [0.75, 1.9], {
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.ease),
  })
  const mapPan = interpolate(frame, [0, durationInFrames], [0, -40])

  // Marker pulse
  const markerIn = spring({ frame: frame - 10, fps, config: { damping: 11, stiffness: 90 } })
  const pulse = (Math.sin((frame / fps) * 3) + 1) / 2

  // Photo card : apparaît après ~1.5s, Ken Burns
  const cardStart = fps * 1.4
  const cardIn = spring({ frame: frame - cardStart, fps, config: { damping: 14, stiffness: 80 } })
  const kb = interpolate(frame, [cardStart, durationInFrames], [1.05, 1.22], { extrapolateLeft: 'clamp' })

  // Titre
  const titleIn = spring({ frame: frame - fps * 0.5, fps, config: { damping: 13, stiffness: 90 } })

  // Sous-titres animés (langue choisie)
  const captions = buildReelContent(place, lang).captions
  const capStart = fps * 3.2
  const capWindow = (durationInFrames - capStart) / Math.max(1, captions.length)
  const capIdx = Math.min(captions.length - 1, Math.max(0, Math.floor((frame - capStart) / capWindow)))
  const capLocal = frame - capStart - capIdx * capWindow
  const capOpacity = frame < capStart ? 0 : interpolate(capLocal, [0, 8, capWindow - 8, capWindow], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const capSlide = interpolate(capLocal, [0, 12], [24, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Outro fade
  const outro = interpolate(frame, [durationInFrames - fps * 0.6, durationInFrames], [1, 0], { extrapolateLeft: 'clamp' })

  return (
    <AbsoluteFill style={{ backgroundColor: '#05060d', fontFamily: 'Inter, system-ui, sans-serif', opacity: outro }}>
      {/* ═══ VOIX (narration FR/EN) ═══ */}
      {narrationSrc && (
        <Audio src={/^https?:\/\/|^\//.test(narrationSrc) ? narrationSrc : staticFile(narrationSrc)} />
      )}

      {/* ═══ CARTE (fond, zoom continu) ═══ */}
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${mapScale}) translateY(${mapPan}px)`, transformOrigin: '50% 45%' }}>
        <MapTiles lat={place.latitude} lng={place.longitude} zoom={baseZoom} />
      </div>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 42%, transparent 30%, rgba(5,6,13,0.75) 100%)' }} />

      {/* ═══ MARKER ═══ */}
      <svg style={{ position: 'absolute', inset: 0 }} viewBox={`0 0 ${CITY_REEL_W} ${CITY_REEL_H}`}>
        <g transform={`translate(${CITY_REEL_W / 2}, ${CITY_REEL_H * 0.45}) scale(${markerIn})`}>
          <circle r={26 + pulse * 22} fill="none" stroke={color} strokeWidth={2} opacity={0.35 * (1 - pulse)} />
          <circle r={20} fill={`${color}30`} />
          <circle r={10} fill={color} stroke="#fff" strokeWidth={3} />
        </g>
      </svg>

      {/* ═══ EN-TÊTE — marque ═══ */}
      <div style={{ position: 'absolute', top: 70, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontSize: 22, letterSpacing: 10, textTransform: 'uppercase', color: '#fbbf24', fontWeight: 800 }}>
          Last Cathar
        </div>
        <div style={{ fontSize: 15, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
          Trésors · Mythes · Histoires
        </div>
      </div>

      {/* ═══ CARTE PHOTO du lieu ═══ */}
      {heroImage && (
        <div style={{
          position: 'absolute', top: 300, left: 90, right: 90, height: 720,
          borderRadius: 36, overflow: 'hidden', border: '3px solid rgba(251,191,36,0.35)',
          boxShadow: '0 30px 90px rgba(0,0,0,0.7)',
          opacity: cardIn, transform: `translateY(${(1 - cardIn) * 60}px) scale(${0.9 + cardIn * 0.1})`,
        }}>
          <img src={heroImage} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${kb})` }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,6,13,0.85) 0%, transparent 45%)' }} />
          {/* Badge catégorie */}
          <div style={{ position: 'absolute', top: 22, left: 22, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 30, background: `${color}30`, border: `1.5px solid ${color}`, backdropFilter: 'blur(6px)' }}>
            <span style={{ fontSize: 22 }}>{catIcon}</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{catLabel}</span>
          </div>
          {/* Époque */}
          {place.era && (
            <div style={{ position: 'absolute', top: 22, right: 22, padding: '8px 16px', borderRadius: 30, background: 'rgba(0,0,0,0.5)', border: '1.5px solid rgba(255,255,255,0.2)', fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
              {place.era}
            </div>
          )}
        </div>
      )}

      {/* ═══ TITRE ═══ */}
      <div style={{ position: 'absolute', top: heroImage ? 1050 : 620, left: 70, right: 70, textAlign: 'center', opacity: titleIn, transform: `translateY(${(1 - titleIn) * 30}px)` }}>
        <div style={{ fontSize: 76, fontWeight: 900, color: '#fff', lineHeight: 1.05, textShadow: '0 6px 40px rgba(0,0,0,0.9)' }}>
          {place.title}
        </div>
        <div style={{ marginTop: 14, fontSize: 26, letterSpacing: 3, textTransform: 'uppercase', color, fontWeight: 700 }}>
          {place.country}
        </div>
      </div>

      {/* ═══ SOUS-TITRES (histoire, style TikTok) ═══ */}
      <div style={{ position: 'absolute', bottom: 180, left: 70, right: 70, textAlign: 'center' }}>
        <div style={{
          display: 'inline-block', opacity: capOpacity, transform: `translateY(${capSlide}px)`,
          fontSize: 40, fontWeight: 800, lineHeight: 1.25, color: '#fff',
          padding: '20px 28px', borderRadius: 22,
          background: 'rgba(5,6,13,0.72)', border: '1.5px solid rgba(251,191,36,0.25)',
          textShadow: '0 2px 16px rgba(0,0,0,0.9)',
        }}>
          {captions[capIdx]}
        </div>
      </div>

      {/* ═══ PIED — CTA ═══ */}
      <div style={{ position: 'absolute', bottom: 70, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>
          📍 Explore sur <span style={{ color: '#fbbf24' }}>Last Cathar</span>
        </div>
      </div>

      {/* Barre de progression */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, backgroundColor: 'rgba(255,255,255,0.08)' }}>
        <div style={{ height: '100%', width: `${(frame / durationInFrames) * 100}%`, backgroundColor: '#fbbf24' }} />
      </div>
    </AbsoluteFill>
  )
}
