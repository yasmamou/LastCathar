import React from 'react'
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Img,
} from 'remotion'

const PLACES = [
  { title: 'Abbaye de Fontfroide', date: '1208', role: 'Le meurtre du légat Pierre de Castelnau déclenche la croisade', desc: 'Somptueuse abbaye cistercienne au cœur des Corbières, lieu clé de la lutte contre le catharisme.', lat: 43.1294, lng: 2.8878, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/France-Abbaye_de_Fontfroide-Vue_d%27ensemble2.jpg/1280px-France-Abbaye_de_Fontfroide-Vue_d%27ensemble2.jpg', badge: 'Abbaye' },
  { title: 'Cité de Carcassonne', date: '1209', role: 'Capitale du vicomte Trencavel — tombée, devient base de Simon de Montfort', desc: 'Forteresse médiévale emblématique, classée UNESCO, au cœur du pays cathare.', lat: 43.2065, lng: 2.3634, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/France_cite_carcassonne_dame_carcas.jpg/1280px-France_cite_carcassonne_dame_carcas.jpg', badge: 'Forteresse' },
  { title: 'Massacre de Béziers', date: '22 juillet 1209', role: '« Tuez-les tous, Dieu reconnaîtra les siens ! »', desc: 'La prise de Béziers inaugura la croisade albigeoise par un massacre de milliers d\'habitants.', lat: 43.344, lng: 3.2158, img: '', badge: 'Massacre' },
  { title: 'Minerve', date: '1210', role: 'Premier bûcher — 140 parfaits brûlés après 7 semaines de siège', desc: 'Village perché sur un éperon rocheux, lieu du premier bûcher de la croisade albigeoise.', lat: 43.3544, lng: 2.7467, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Minerve_juin_2005_3.jpg/1280px-Minerve_juin_2005_3.jpg', badge: 'Bûcher' },
  { title: 'Château de Termes', date: '1210', role: 'Siège de 4 mois — la forteresse tombe par contamination de l\'eau', desc: 'Forteresse cathare imprenable dans les gorges du Termenet.', lat: 43.0014, lng: 2.5681, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Le_ch%C3%A2teau_de_Termes%2C_vu_depuis_le_nord-ouest.jpg/1280px-Le_ch%C3%A2teau_de_Termes%2C_vu_depuis_le_nord-ouest.jpg', badge: 'Siège' },
  { title: 'Châteaux de Lastours', date: '1211', role: 'Cabaret — foyer de résistance cathare et de culture occitane', desc: 'Quatre châteaux alignés sur une crête vertigineuse dominant la vallée de l\'Orbiel.', lat: 43.3356, lng: 2.3783, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Castles_of_Lastours121.JPG/1280px-Castles_of_Lastours121.JPG', badge: 'Résistance' },
  { title: 'Château de Foix', date: '1211-1229', role: 'Le comte de Foix — protecteur des cathares, jamais pris', desc: 'Impressionnante forteresse des comtes de Foix, jamais conquise par les croisés.', lat: 42.9664, lng: 1.6078, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Castle_of_Foix_05.jpg/1280px-Castle_of_Foix_05.jpg', badge: 'Forteresse' },
  { title: 'Château de Montségur', date: '16 mars 1244', role: '225 parfaits montent sur le bûcher — fin du catharisme', desc: 'Dernier bastion cathare, tombé en 1244 après un siège de dix mois.', lat: 42.8756, lng: 1.8325, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Ch%C3%A2teau_de_Monts%C3%A9gur_-_vue_a%C3%A9rienne.jpg/1280px-Ch%C3%A2teau_de_Monts%C3%A9gur_-_vue_a%C3%A9rienne.jpg', badge: 'Bûcher' },
  { title: 'Château de Quéribus', date: '1255', role: 'Dernière forteresse cathare à tomber — 11 ans après Montségur', desc: 'Perché sur un vertigineux piton rocheux des Corbières.', lat: 42.8364, lng: 2.6211, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/130610-Queribus-03.jpg/1280px-130610-Queribus-03.jpg', badge: 'Dernier refuge' },
  { title: 'Château de Peyrepertuse', date: 'XIIIe siècle', role: '« Carcassonne céleste » — forteresse royale gardant la frontière', desc: 'Immense forteresse dominant les Corbières sur une crête vertigineuse.', lat: 42.8708, lng: 2.5556, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/ChateauPeyrepertuse.JPG/1280px-ChateauPeyrepertuse.JPG', badge: 'Frontière' },
  { title: 'Pic de Bugarach', date: '', role: 'Montagne mystérieuse — les cathares y auraient caché des secrets', desc: 'Montagne « inversée » des Corbières, phénomènes étranges et légendes ésotériques.', lat: 42.8789, lng: 2.3519, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Bugarach_2013_1.jpg/1280px-Bugarach_2013_1.jpg', badge: 'Mystère' },
  { title: 'Rennes-le-Château', date: '1891', role: 'Le mystère Saunière — fortune inexplicable liée au trésor cathare ?', desc: 'Village mystérieux où l\'abbé Saunière aurait découvert un fabuleux trésor.', lat: 42.9272, lng: 2.2627, img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Rennas-le-Chateau_-_Torre_Magdala.jpg/1280px-Rennas-le-Chateau_-_Torre_Magdala.jpg', badge: 'Trésor' },
]

function geoToScreen(lat: number, lng: number, cLat: number, cLng: number, scale: number) {
  return { x: 600 + (lng - cLng) * scale, y: 540 - (lat - cLat) * scale }
}

export const CroisadeCathare: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()
  const total = PLACES.length
  const fpp = Math.floor(durationInFrames / total) // frames per place

  const idx = Math.min(Math.floor(frame / fpp), total - 1)
  const pf = frame - idx * fpp // frame within current place
  const place = PLACES[idx]
  const prev = idx > 0 ? PLACES[idx - 1] : place
  const next = PLACES[Math.min(idx + 1, total - 1)]

  // Camera
  const arriveT = Math.min(pf / (fpp * 0.2), 1)
  const departT = Math.max((pf - fpp * 0.8) / (fpp * 0.2), 0)

  let cLat: number, cLng: number, cScale: number
  if (arriveT < 1) {
    cLat = interpolate(arriveT, [0, 1], [prev.lat, place.lat])
    cLng = interpolate(arriveT, [0, 1], [prev.lng, place.lng])
    cScale = interpolate(arriveT, [0, 0.5, 1], [120, 80, 140])
  } else if (departT > 0) {
    cLat = interpolate(departT, [0, 1], [place.lat, next.lat])
    cLng = interpolate(departT, [0, 1], [place.lng, next.lng])
    cScale = interpolate(departT, [0, 0.5, 1], [140, 80, 120])
  } else {
    cLat = place.lat; cLng = place.lng; cScale = 140
  }

  const markerS = spring({ frame: pf, fps, config: { damping: 12, stiffness: 120 } })

  // Sidebar animation
  const sidebarX = interpolate(
    pf, [fps * 0.2, fps * 0.5, fpp - fps * 0.4, fpp - fps * 0.1],
    [420, 0, 0, 420],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )
  const sidebarOpacity = interpolate(
    pf, [fps * 0.2, fps * 0.5, fpp - fps * 0.4, fpp - fps * 0.1],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )

  const visited = PLACES.slice(0, idx + 1)

  // Grid
  const gridLines: React.ReactNode[] = []
  for (let lat = 42; lat <= 44; lat += 0.5) {
    const a = geoToScreen(lat, 0, cLat, cLng, cScale)
    const b = geoToScreen(lat, 5, cLat, cLng, cScale)
    gridLines.push(<line key={`la${lat}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(239,68,68,0.05)" strokeWidth={1} />)
  }
  for (let lng = 0; lng <= 5; lng += 0.5) {
    const a = geoToScreen(41, lng, cLat, cLng, cScale)
    const b = geoToScreen(44, lng, cLat, cLng, cScale)
    gridLines.push(<line key={`lo${lng}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(239,68,68,0.05)" strokeWidth={1} />)
  }

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0f' }}>
      {/* Subtle glow */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 35% 50%, rgba(239,68,68,0.03) 0%, transparent 60%)' }} />

      {/* Map area (left 60%) */}
      <svg style={{ position: 'absolute', left: 0, top: 0, width: 1200, height: 1080 }} viewBox="0 0 1200 1080">
        {gridLines}

        {/* Lines */}
        {visited.map((p, i) => {
          if (i === 0) return null
          const a = geoToScreen(visited[i-1].lat, visited[i-1].lng, cLat, cLng, cScale)
          const b = geoToScreen(p.lat, p.lng, cLat, cLng, cScale)
          return <line key={`l${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#ef4444" strokeWidth={2} strokeDasharray="6,4" opacity={0.35} />
        })}

        {/* Past dots */}
        {visited.map((p, i) => {
          if (i === idx) return null
          const s = geoToScreen(p.lat, p.lng, cLat, cLng, cScale)
          return <circle key={`d${i}`} cx={s.x} cy={s.y} r={5} fill="#ef4444" opacity={0.3} />
        })}

        {/* Current marker */}
        {(() => {
          const s = geoToScreen(place.lat, place.lng, cLat, cLng, cScale)
          return (
            <g transform={`translate(${s.x},${s.y}) scale(${markerS})`}>
              <circle r={18} fill="none" stroke="#ef4444" strokeWidth={1.5} opacity={0.3}>
                <animate attributeName="r" from="10" to="28" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <circle r={12} fill="rgba(239,68,68,0.15)" />
              <circle r={7} fill="#ef4444" stroke="#fff" strokeWidth={2} />
            </g>
          )
        })()}
      </svg>

      {/* === SIDEBAR (right side) === */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 480,
          opacity: sidebarOpacity,
          transform: `translateX(${sidebarX}px)`,
          background: 'linear-gradient(to right, rgba(10,10,15,0.0) 0%, rgba(10,10,15,0.95) 8%, rgba(10,10,15,0.98) 100%)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Hero image */}
        <div style={{ position: 'relative', height: 300, overflow: 'hidden', flexShrink: 0 }}>
          {place.img ? (
            <>
              <Img src={place.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,15,1) 0%, rgba(10,10,15,0.3) 50%, transparent 100%)' }} />
            </>
          ) : (
            <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, rgba(239,68,68,0.1) 0%, #0a0a0f 100%)` }} />
          )}

          {/* Badge */}
          <div style={{
            position: 'absolute', bottom: 100, left: 32,
            padding: '4px 14px', borderRadius: 20,
            backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
            fontSize: 12, color: '#ef4444', fontFamily: 'system-ui', fontWeight: 600,
            letterSpacing: 2, textTransform: 'uppercase',
          }}>
            {place.badge}
          </div>

          {/* Title */}
          <div style={{
            position: 'absolute', bottom: 30, left: 32, right: 32,
            fontSize: 32, fontWeight: 800, color: '#fff', fontFamily: 'system-ui',
            lineHeight: 1.15, textShadow: '0 3px 20px rgba(0,0,0,0.9)',
          }}>
            {place.title}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 32px', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Date + counter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {place.date && (
              <span style={{
                padding: '3px 10px', borderRadius: 6,
                backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                fontSize: 13, color: '#fb7185', fontFamily: 'system-ui',
              }}>
                📅 {place.date}
              </span>
            )}
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontFamily: 'system-ui' }}>
              {idx + 1} / {total}
            </span>
          </div>

          {/* Role */}
          <div style={{
            fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,0.9)',
            fontFamily: 'system-ui', lineHeight: 1.4,
          }}>
            {place.role}
          </div>

          {/* Separator */}
          <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)' }} />

          {/* Description */}
          <div style={{
            fontSize: 15, color: 'rgba(255,255,255,0.5)',
            fontFamily: 'system-ui', lineHeight: 1.6,
          }}>
            {place.desc}
          </div>

          {/* Coordinates */}
          <div style={{
            marginTop: 'auto',
            fontSize: 11, color: 'rgba(255,255,255,0.15)',
            fontFamily: 'system-ui', letterSpacing: 1,
          }}>
            🧭 {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
          </div>
        </div>
      </div>

      {/* Top header */}
      <div style={{ position: 'absolute', top: 36, left: 60, display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontSize: 32 }}>🔥</span>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', fontFamily: 'system-ui' }}>
            Last Cathar — Épopée
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#ef4444', fontFamily: 'system-ui' }}>
            La Croisade Cathare
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.05)' }}>
        <div style={{ height: '100%', width: `${(frame / durationInFrames) * 100}%`, backgroundColor: '#ef4444', boxShadow: '0 0 10px rgba(239,68,68,0.5)' }} />
      </div>
    </AbsoluteFill>
  )
}
