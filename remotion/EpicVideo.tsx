import React from 'react'
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion'
import { PlaceEntry } from '../src/types/places'
import { staticFile } from 'remotion'

export interface EpicPlaceData {
  place: PlaceEntry // real Last Cathar data
  role: string
  date: string
}

export interface EpicConfig {
  id: string // epic id for sidebar screenshot path
  title: string
  subtitle: string
  icon: string
  color: string
  places: EpicPlaceData[]
  mapZoom?: number // default 9
}

// ─── Map Tiles ───
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
  const W = 1920
  const H = 1080
  const z = Math.round(zoom)
  const center = lngLatToTile(lng, lat, z)
  const tilesX = Math.ceil(W / TILE) + 2
  const tilesY = Math.ceil(H / TILE) + 2
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
          style={{
            position: 'absolute',
            left: Math.round(offX + dx * TILE),
            top: Math.round(offY + dy * TILE),
            width: TILE,
            height: TILE,
          }}
        />
      )
    }
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', filter: 'brightness(0.85) saturate(0.5) contrast(1.1)' }}>
      {tiles}
    </div>
  )
}

// ─── Geo → Screen ───
function geo2s(lat: number, lng: number, cLat: number, cLng: number, scale: number) {
  return { x: 960 + (lng - cLng) * scale, y: 540 - (lat - cLat) * scale }
}

// ─── Main Component ───
export const EpicVideo: React.FC<{ config: EpicConfig }> = ({ config }) => {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()
  const { places, title, subtitle, icon, color } = config
  const total = places.length
  const fpp = Math.floor(durationInFrames / total)

  const idx = Math.min(Math.floor(frame / fpp), total - 1)
  const pf = frame - idx * fpp
  const epPlace = places[idx]
  const p = epPlace.place // real PlaceEntry

  // Camera — stays on current place, cuts with fade between places
  const cLat = p.latitude
  const cLng = p.longitude
  const mapZoom = config.mapZoom ?? 9
  const cScale = mapZoom * 20

  // Fade in/out between places (no sliding)
  const fadeDur = fps * 0.4 // 0.4s fade
  const fadeIn = interpolate(pf, [0, fadeDur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const fadeOut = interpolate(pf, [fpp - fadeDur, fpp], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const mapOpacity = fadeIn * fadeOut

  const markerS = spring({ frame: pf, fps, config: { damping: 12, stiffness: 120 } })

  // Bottom-left text animation
  const textOpacity = interpolate(pf, [fps * 0.3, fps * 0.6, fpp - fps * 0.5, fpp - fps * 0.1], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const textSlide = interpolate(pf, [fps * 0.3, fps * 0.8], [30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Sidebar animation
  const sideX = interpolate(pf, [fps * 0.15, fps * 0.45, fpp - fps * 0.4, fpp - fps * 0.1], [400, 0, 0, 400], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const sideOp = interpolate(pf, [fps * 0.15, fps * 0.45, fpp - fps * 0.4, fpp - fps * 0.1], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const visited = places.slice(0, idx + 1)

  return (
    <AbsoluteFill style={{ backgroundColor: '#08090f' }}>
      {/* ═══ MAP TILES BACKGROUND ═══ */}
      <div style={{ opacity: mapOpacity }}>
        <MapTiles lat={cLat} lng={cLng} zoom={mapZoom} />
      </div>

      {/* Light vignette — edges only */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(8,9,15,0.35) 100%)' }} />

      {/* ═══ MARKERS (SVG) ═══ */}
      <svg style={{ position: 'absolute', inset: 0, opacity: mapOpacity }} viewBox="0 0 1920 1080">
        {/* Lines between visited places */}
        {visited.map((vp, i) => {
          if (i === 0) return null
          const a = geo2s(visited[i - 1].place.latitude, visited[i - 1].place.longitude, cLat, cLng, cScale)
          const b = geo2s(vp.place.latitude, vp.place.longitude, cLat, cLng, cScale)
          return <line key={`l${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={2} strokeDasharray="8,5" opacity={0.4} />
        })}

        {/* Past dots */}
        {visited.map((vp, i) => {
          if (i === idx) return null
          const s = geo2s(vp.place.latitude, vp.place.longitude, cLat, cLng, cScale)
          return <circle key={`d${i}`} cx={s.x} cy={s.y} r={5} fill={color} opacity={0.35} />
        })}

        {/* Current marker */}
        {(() => {
          const s = geo2s(p.latitude, p.longitude, cLat, cLng, cScale)
          return (
            <g transform={`translate(${s.x},${s.y}) scale(${markerS})`}>
              <circle r={20} fill="none" stroke={color} strokeWidth={1.5} opacity={0.3}>
                <animate attributeName="r" from="10" to="30" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <circle r={13} fill={`${color}25`} />
              <circle r={7} fill={color} stroke="#fff" strokeWidth={2.5} />
            </g>
          )
        })()}
      </svg>

      {/* ═══ BOTTOM GRADIENT ═══ */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 380, background: 'linear-gradient(to top, rgba(8,9,15,0.95) 0%, rgba(8,9,15,0.5) 50%, transparent 100%)' }} />

      {/* ═══ BOTTOM-LEFT TEXT ═══ */}
      <div style={{ position: 'absolute', bottom: 60, left: 70, maxWidth: 750, opacity: textOpacity, transform: `translateY(${textSlide}px)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
          <span style={{ fontSize: 13, letterSpacing: 4, textTransform: 'uppercase', color, fontFamily: 'system-ui', fontWeight: 700 }}>
            {idx + 1} / {total}
          </span>
          {epPlace.date && (
            <span style={{ padding: '3px 12px', borderRadius: 20, backgroundColor: `${color}20`, border: `1px solid ${color}40`, fontSize: 13, color: `${color}cc`, fontFamily: 'system-ui' }}>
              {epPlace.date}
            </span>
          )}
        </div>
        <div style={{ fontSize: 48, fontWeight: 800, color: '#fff', fontFamily: 'system-ui', textShadow: '0 4px 30px rgba(0,0,0,0.9)', lineHeight: 1.1, marginBottom: 12 }}>
          {p.title}
        </div>
        <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.65)', fontFamily: 'system-ui', textShadow: '0 2px 10px rgba(0,0,0,0.7)', lineHeight: 1.4 }}>
          {epPlace.role}
        </div>
      </div>

      {/* ═══ SIDEBAR RIGHT — real screenshot from Last Cathar ═══ */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 420,
        opacity: sideOp, transform: `translateX(${sideX}px)`,
        overflow: 'hidden',
        backgroundColor: '#05060d',
      }}>
        <img
          src={staticFile(`sidebars/${config.id}/${p.slug}.png`)}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
        />
      </div>

      {/* ═══ TOP HEADER ═══ */}
      <div style={{ position: 'absolute', top: 32, left: 60, display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontSize: 32 }}>{icon}</span>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', fontFamily: 'system-ui' }}>
            Last Cathar — Épopée
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color, fontFamily: 'system-ui' }}>
            {title}
          </div>
        </div>
      </div>

      {/* Subtitle top-right */}
      <div style={{ position: 'absolute', top: 40, right: 450, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.15)', fontFamily: 'system-ui', textAlign: 'right' }}>
        {subtitle}
      </div>

      {/* ═══ PROGRESS BAR ═══ */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.05)' }}>
        <div style={{ height: '100%', width: `${(frame / durationInFrames) * 100}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}80` }} />
      </div>
    </AbsoluteFill>
  )
}
