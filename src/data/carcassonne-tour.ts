// Parcours guidé immersif de la Cité de Carcassonne.
// Joint : textes (carcassonne-tour.json), images Wikimedia + crédits
// (carcassonne-tour-images.json) et audios générés (carcassonne-tour-durations.json).

import tourJson from './carcassonne-tour.json'
import imagesJson from './carcassonne-tour-images.json'
import durations from './carcassonne-tour-durations.json'
import type { GuideLang } from './audio-guides'

export interface TourImage {
  src: string
  artist: string
  license: string
  source: string
}

export interface TourStop {
  id: string
  title: Record<GuideLang, string>
  subtitle: Record<GuideLang, string>
  text: Record<GuideLang, string>
  images: TourImage[]
  audio: Record<GuideLang, { file: string; duration: number }>
}

export interface Tour {
  id: string
  placeSlug: string
  title: Record<GuideLang, string>
  subtitle: Record<GuideLang, string>
  stops: TourStop[]
}

const imagesMap = imagesJson as Record<string, TourImage[]>
const durationMap = durations as Record<string, number>

function buildTour(): Tour {
  const stops: TourStop[] = tourJson.stops.map((s) => ({
    id: s.id,
    title: s.title as Record<GuideLang, string>,
    subtitle: s.subtitle as Record<GuideLang, string>,
    text: s.text as Record<GuideLang, string>,
    images: imagesMap[s.id] ?? [],
    audio: {
      fr: { file: `/tour/carcassonne/audio/${s.id}.fr.m4a`, duration: durationMap[`${s.id}.fr`] ?? 40 },
      en: { file: `/tour/carcassonne/audio/${s.id}.en.m4a`, duration: durationMap[`${s.id}.en`] ?? 40 },
    },
  }))
  return {
    id: tourJson.id,
    placeSlug: tourJson.placeSlug,
    title: tourJson.title as Record<GuideLang, string>,
    subtitle: tourJson.subtitle as Record<GuideLang, string>,
    stops,
  }
}

const CARCASSONNE_TOUR = buildTour()

const TOURS_BY_PLACE = new Map<string, Tour>([[CARCASSONNE_TOUR.placeSlug, CARCASSONNE_TOUR]])

export function getTourForPlace(placeSlug: string): Tour | undefined {
  return TOURS_BY_PLACE.get(placeSlug)
}
