import React from 'react'
import { registerRoot, Composition } from 'remotion'
import { EpicVideo, EpicConfig, EpicPlaceData } from './EpicVideo'
import { CityReel, CITY_REEL_FPS, CITY_REEL_DURATION, CITY_REEL_W, CITY_REEL_H } from './CityReel'

// Import directly from Last Cathar data
import { EPICS } from '../src/data/epics'
import { allPlaces } from '../src/data/all-places'
// Data is now passed as PlaceEntry directly — no need for category utils here

const FPS = 30
const DURATION = 60

// ─── Build EpicConfig from Last Cathar data ───
function buildEpicConfig(epicId: string, mapZoom: number): EpicConfig {
  const epic = EPICS.find(e => e.id === epicId)
  if (!epic) throw new Error(`Epic "${epicId}" not found`)

  const places: EpicPlaceData[] = epic.places
    .map(ep => {
      const p = allPlaces.find(pl => pl.slug === ep.slug)
      if (!p) return null
      return {
        place: p, // pass the real PlaceEntry directly
        role: ep.role,
        date: ep.date || '',
      }
    })
    .filter((p): p is EpicPlaceData => p !== null)

  return {
    id: epicId,
    title: epic.title,
    subtitle: epic.subtitle,
    icon: epic.icon,
    color: epic.color,
    places,
    mapZoom,
  }
}

// ─── Video configurations ───
const EPIC_VIDEOS: { id: string; epicId: string; zoom: number }[] = [
  { id: 'CroisadeCathare', epicId: 'croisade-cathare', zoom: 10 },
  { id: 'RoisBerberes', epicId: 'rois-berberes', zoom: 6 },
]

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* ─── Reel vertical par ville (Instagram / TikTok) ─── */}
      <Composition
        id="CityReel"
        component={CityReel as unknown as React.ComponentType<Record<string, unknown>>}
        durationInFrames={CITY_REEL_FPS * CITY_REEL_DURATION}
        fps={CITY_REEL_FPS}
        width={CITY_REEL_W}
        height={CITY_REEL_H}
        defaultProps={{ placeSlug: 'cite-de-carcassonne' }}
      />

      {EPIC_VIDEOS.map(({ id, epicId, zoom }) => {
        const config = buildEpicConfig(epicId, zoom)
        const Comp: React.FC = () => <EpicVideo config={config} />
        return (
          <Composition
            key={id}
            id={id}
            component={Comp}
            durationInFrames={FPS * DURATION}
            fps={FPS}
            width={1920}
            height={1080}
          />
        )
      })}
    </>
  )
}

registerRoot(RemotionRoot)
