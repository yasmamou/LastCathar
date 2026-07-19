// Visites guidées des lieux de l'épopée cathare (Montségur, Foix, Béziers…).
// Contenu : cathar-tours.json (textes 5 étapes FR/EN par lieu).
// Images : réutilisées depuis les données du lieu (all-places).
// Audio : /tour/<placeSlug>/audio/<stopId>.<lang>.m4a, durées dans
// cathar-tours-durations.json (générées par scripts/generate-cathar-tour-audio.py).

import toursJson from './cathar-tours.json'
import durations from './cathar-tours-durations.json'
import { allPlaces } from './all-places'
import type { GuideLang } from './audio-guides'
import type { Tour, TourStop, TourImage } from './carcassonne-tour'

const durationMap = durations as Record<string, number>

function imagesForPlace(placeSlug: string): TourImage[] {
  const place = allPlaces.find((p) => p.slug === placeSlug)
  if (!place) return []
  const urls = [place.heroImageUrl, ...(place.imageUrls ?? [])].filter(
    (u): u is string => typeof u === 'string' && u.length > 0,
  )
  const unique = Array.from(new Set(urls))
  const source = place.sourceLinks?.[0] ?? ''
  return unique.map((src) => ({ src, artist: '', license: '', source }))
}

function buildCatharTours(): Tour[] {
  return toursJson.tours.map((t) => {
    const images = imagesForPlace(t.placeSlug)
    const stops: TourStop[] = t.stops.map((s) => ({
      id: s.id,
      title: s.title as Record<GuideLang, string>,
      subtitle: s.subtitle as Record<GuideLang, string>,
      text: s.text as Record<GuideLang, string>,
      images,
      audio: {
        fr: { file: `/tour/${t.placeSlug}/audio/${s.id}.fr.m4a`, duration: durationMap[`${t.placeSlug}/${s.id}.fr`] ?? 40 },
        en: { file: `/tour/${t.placeSlug}/audio/${s.id}.en.m4a`, duration: durationMap[`${t.placeSlug}/${s.id}.en`] ?? 40 },
      },
    }))
    return {
      id: t.id,
      placeSlug: t.placeSlug,
      title: t.title as Record<GuideLang, string>,
      subtitle: t.subtitle as Record<GuideLang, string>,
      stops,
    }
  })
}

export const CATHAR_TOURS: Tour[] = buildCatharTours()
