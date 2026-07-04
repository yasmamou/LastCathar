import React from 'react'
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion'

const PLACES = [
  { title: "Tassili n'Ajjer", date: '10 000 av. J.-C.', role: 'Les origines : 15 000 peintures rupestres au Sahara vert', lat: 25.5, lng: 9.0 },
  { title: 'Le Medracen', date: 'IIIe s. av. J.-C.', role: 'Plus ancien monument royal d\'Afrique du Nord', lat: 35.5833, lng: 5.7167 },
  { title: 'Cirta — Massinissa', date: '238-148 av. J.-C.', role: 'Capitale de Massinissa, unificateur de la Numidie', lat: 36.365, lng: 6.6147 },
  { title: 'Table de Jugurtha', date: '112-105 av. J.-C.', role: '7 ans de guerre contre Rome', lat: 35.7311, lng: 8.2511 },
  { title: 'Caesarea — Juba II', date: '25 av. J.-C.', role: 'Juba II et Cléopâtre Séléné — synthèse berbéro-romaine', lat: 36.6017, lng: 2.1892 },
  { title: 'Tombeau Royal', date: 'Ier siècle', role: 'Mausolée monumental de Juba II et Cléopâtre Séléné', lat: 36.5711, lng: 2.4261 },
  { title: 'Djemila', date: 'Ier siècle', role: 'Splendeur romaine en terre numide — la « belle » en arabe', lat: 36.3167, lng: 5.7333 },
  { title: 'Timgad', date: '100', role: 'La Pompéi d\'Afrique — fondée par Trajan en Numidie', lat: 35.4845, lng: 6.467 },
  { title: 'Dougga', date: 'IIe s. av. J.-C.', role: 'Mausolée libyco-punique, symbole de l\'identité numide', lat: 36.4225, lng: 9.2194 },
  { title: 'Tin Hinan', date: 'IVe siècle', role: 'Reine-ancêtre des Touaregs, retrouvée parée d\'or au Hoggar', lat: 22.9167, lng: 4.6667 },
  { title: 'La Kahina', date: '698-703', role: 'Dernière reine berbère — vaincue mais jamais soumise', lat: 35.3, lng: 6.5 },
  { title: 'Koumbi Saleh', date: 'IXe siècle', role: 'Berbères Sanhadja — maîtres du commerce transsaharien', lat: 15.7667, lng: -7.9667 },
  { title: 'Sijilmassa', date: '757', role: '700 ans de porte d\'entrée de l\'or africain', lat: 31.2833, lng: -4.2833 },
  { title: 'Ghardaïa', date: 'XIe siècle', role: 'Cités ibadites du M\'Zab — inspirèrent Le Corbusier', lat: 32.4912, lng: 3.6735 },
  { title: 'Aït-Ben-Haddou', date: 'XIe siècle', role: 'Architecture berbère en terre rouge, immortelle', lat: 31.047, lng: -7.132 },
  { title: 'Volubilis', date: 'Ier siècle', role: 'Cité romano-berbère — palais de Juba II au Maroc', lat: 34.0735, lng: -5.5544 },
]

// Map bounds for North/West Africa
const MAP = {
  minLat: 10,
  maxLat: 40,
  minLng: -15,
  maxLng: 15,
}

function geoToScreen(lat: number, lng: number, centerLat: number, centerLng: number, scale: number) {
  const x = 960 + (lng - centerLng) * scale
  const y = 540 - (lat - centerLat) * scale
  return { x, y }
}

export const RoisBerberes: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()
  const totalPlaces = PLACES.length
  const framesPerPlace = Math.floor(durationInFrames / totalPlaces)

  const placeIndex = Math.min(Math.floor(frame / framesPerPlace), totalPlaces - 1)
  const placeFrame = frame - placeIndex * framesPerPlace
  const placeProgress = placeFrame / framesPerPlace

  const currentPlace = PLACES[placeIndex]
  const prevPlace = placeIndex > 0 ? PLACES[placeIndex - 1] : currentPlace
  const nextPlace = PLACES[Math.min(placeIndex + 1, totalPlaces - 1)]

  // Smooth camera position with transition
  const arrivePhase = Math.min(placeFrame / (framesPerPlace * 0.2), 1) // 0-1 during first 20%
  const departPhase = Math.max((placeFrame - framesPerPlace * 0.8) / (framesPerPlace * 0.2), 0) // 0-1 during last 20%

  let camLat: number, camLng: number, camScale: number

  if (arrivePhase < 1) {
    // Arriving: interpolate from previous
    camLat = interpolate(arrivePhase, [0, 1], [prevPlace.lat, currentPlace.lat])
    camLng = interpolate(arrivePhase, [0, 1], [prevPlace.lng, currentPlace.lng])
    camScale = interpolate(arrivePhase, [0, 0.5, 1], [60, 45, 70])
  } else if (departPhase > 0) {
    // Departing: start moving to next
    camLat = interpolate(departPhase, [0, 1], [currentPlace.lat, nextPlace.lat])
    camLng = interpolate(departPhase, [0, 1], [currentPlace.lng, nextPlace.lng])
    camScale = interpolate(departPhase, [0, 0.5, 1], [70, 45, 60])
  } else {
    // Holding on current place
    camLat = currentPlace.lat
    camLng = currentPlace.lng
    camScale = 70
  }

  // Marker animation
  const markerScale = spring({ frame: placeFrame, fps, config: { damping: 12, stiffness: 120 } })

  // Text animation
  const textOpacity = interpolate(
    placeFrame,
    [fps * 0.3, fps * 0.6, framesPerPlace - fps * 0.5, framesPerPlace - fps * 0.1],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )
  const textSlide = interpolate(
    placeFrame,
    [fps * 0.3, fps * 0.8],
    [30, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )

  // Connection lines (trail of visited places)
  const visitedPlaces = PLACES.slice(0, placeIndex + 1)

  // Grid lines for map feel
  const gridLines: React.ReactNode[] = []
  for (let lat = 15; lat <= 40; lat += 5) {
    const p1 = geoToScreen(lat, -15, camLat, camLng, camScale)
    const p2 = geoToScreen(lat, 15, camLat, camLng, camScale)
    gridLines.push(
      <line key={`lat-${lat}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="rgba(194,65,12,0.06)" strokeWidth={1} />
    )
  }
  for (let lng = -15; lng <= 15; lng += 5) {
    const p1 = geoToScreen(10, lng, camLat, camLng, camScale)
    const p2 = geoToScreen(40, lng, camLat, camLng, camScale)
    gridLines.push(
      <line key={`lng-${lng}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="rgba(194,65,12,0.06)" strokeWidth={1} />
    )
  }

  return (
    <AbsoluteFill style={{ backgroundColor: '#08090f' }}>
      {/* Subtle radial gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 50%, rgba(194,65,12,0.04) 0%, transparent 70%)',
        }}
      />

      {/* Grid */}
      <svg style={{ position: 'absolute', inset: 0 }} viewBox="0 0 1920 1080">
        {gridLines}

        {/* Connection lines between visited places */}
        {visitedPlaces.map((place, i) => {
          if (i === 0) return null
          const prev = visitedPlaces[i - 1]
          const p1 = geoToScreen(prev.lat, prev.lng, camLat, camLng, camScale)
          const p2 = geoToScreen(place.lat, place.lng, camLat, camLng, camScale)
          const lineOpacity = i <= placeIndex ? 0.3 : 0
          return (
            <line
              key={`line-${i}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="#c2410c"
              strokeWidth={2}
              strokeDasharray="6,4"
              opacity={lineOpacity}
            />
          )
        })}

        {/* Past place dots */}
        {visitedPlaces.map((place, i) => {
          if (i === placeIndex) return null
          const p = geoToScreen(place.lat, place.lng, camLat, camLng, camScale)
          return (
            <circle
              key={`past-${i}`}
              cx={p.x}
              cy={p.y}
              r={5}
              fill="#c2410c"
              opacity={0.3}
            />
          )
        })}

        {/* Current place marker */}
        {(() => {
          const p = geoToScreen(currentPlace.lat, currentPlace.lng, camLat, camLng, camScale)
          return (
            <g transform={`translate(${p.x}, ${p.y}) scale(${markerScale})`}>
              {/* Pulse ring */}
              <circle r={20} fill="none" stroke="#c2410c" strokeWidth={1.5} opacity={0.3}>
                <animate attributeName="r" from="12" to="30" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite" />
              </circle>
              {/* Inner glow */}
              <circle r={14} fill="rgba(194,65,12,0.15)" />
              {/* Main dot */}
              <circle r={8} fill="#c2410c" stroke="#fff" strokeWidth={2.5} />
            </g>
          )
        })()}
      </svg>

      {/* Bottom gradient for text */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 400,
          background: 'linear-gradient(to top, rgba(8,9,15,0.95) 0%, rgba(8,9,15,0.6) 50%, transparent 100%)',
        }}
      />

      {/* Place info */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: 100,
          right: 100,
          opacity: textOpacity,
          transform: `translateY(${textSlide}px)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
          <span
            style={{
              fontSize: 14,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: '#c2410c',
              fontFamily: 'system-ui, sans-serif',
              fontWeight: 700,
            }}
          >
            {placeIndex + 1} / {totalPlaces}
          </span>
          <span
            style={{
              display: 'inline-block',
              padding: '3px 12px',
              borderRadius: 20,
              backgroundColor: 'rgba(194,65,12,0.15)',
              border: '1px solid rgba(194,65,12,0.3)',
              fontSize: 13,
              color: '#fb923c',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            {currentPlace.date}
          </span>
        </div>

        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: '#ffffff',
            fontFamily: 'system-ui, sans-serif',
            textShadow: '0 4px 40px rgba(0,0,0,0.9)',
            lineHeight: 1.1,
            marginBottom: 16,
          }}
        >
          {currentPlace.title}
        </div>

        <div
          style={{
            fontSize: 22,
            color: 'rgba(255,255,255,0.7)',
            fontFamily: 'system-ui, sans-serif',
            textShadow: '0 2px 15px rgba(0,0,0,0.7)',
            maxWidth: 900,
            lineHeight: 1.4,
          }}
        >
          {currentPlace.role}
        </div>
      </div>

      {/* Top header */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: 80,
          right: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 36 }}>🦁</span>
          <div>
            <div
              style={{
                fontSize: 12,
                letterSpacing: 5,
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.3)',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              Last Cathar — Épopée
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: '#fb923c',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              Rois & Reines Berbères
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: 12,
            letterSpacing: 3,
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.2)',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          10 000 ans de civilisation amazighe
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          backgroundColor: 'rgba(255,255,255,0.05)',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${(frame / durationInFrames) * 100}%`,
            backgroundColor: '#c2410c',
            boxShadow: '0 0 10px rgba(194,65,12,0.5)',
          }}
        />
      </div>
    </AbsoluteFill>
  )
}
