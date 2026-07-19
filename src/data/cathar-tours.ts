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

// Certains lieux (ex. le Sentier cathare, itinéraire) n'ont pas d'image propre :
// on emprunte celles d'un lieu emblématique qu'ils traversent.
const IMAGE_FALLBACK: Record<string, string> = {
  'sentier-cathare': 'chateau-de-montsegur',
}

function imagesForPlace(placeSlug: string): TourImage[] {
  const place = allPlaces.find((p) => p.slug === placeSlug)
  if (!place) return []
  const urls = [place.heroImageUrl, ...(place.imageUrls ?? [])].filter(
    (u): u is string => typeof u === 'string' && u.length > 0,
  )
  const unique = Array.from(new Set(urls))
  const source = place.sourceLinks?.[0] ?? ''
  const imgs = unique.map((src) => ({ src, artist: '', license: '', source }))
  if (imgs.length === 0 && IMAGE_FALLBACK[placeSlug]) {
    return imagesForPlace(IMAGE_FALLBACK[placeSlug])
  }
  return imgs
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
