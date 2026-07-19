// Visites guidées des lieux de l'épopée cathare (Montségur, Foix, Béziers…).
// Contenu : cathar-tours.json (textes 5 étapes FR/EN par lieu).
// Images : réutilisées depuis les données du lieu (all-places).
// Audio : /tour/<placeSlug>/audio/<stopId>.<lang>.m4a, durées dans
// cathar-tours-durations.json (générées par scripts/generate-cathar-tour-audio.py).

import toursJson from './cathar-tours.json'
import durations from './cathar-tours-durations.json'
import extraImages from './cathar-tour-images.json'
import { allPlaces } from './all-places'
import type { GuideLang } from './audio-guides'
import type { Tour, TourStop, TourImage } from './carcassonne-tour'

const durationMap = durations as Record<string, number>
// Galeries de vraies photos par lieu (Wikipédia), récupérées par
// scripts/fetch-cathar-images.py. Prioritaires sur l'image unique du lieu.
const galleryMap = extraImages as Record<string, TourImage[]>

// Certains lieux (ex. le Sentier cathare, itinéraire) n'ont pas d'image propre :
// on emprunte celles d'un lieu emblématique qu'ils traversent.
const IMAGE_FALLBACK: Record<string, string> = {
  'sentier-cathare': 'chateau-de-montsegur',
}

function imagesForPlace(placeSlug: string): TourImage[] {
  // 1) Galerie de vraies photos Wikipédia si disponible.
  const gallery = galleryMap[placeSlug]
  if (gallery && gallery.length > 0) return gallery
  // 2) Sinon, l'image (hero + imageUrls) portée par le lieu.
  const place = allPlaces.find((p) => p.slug === placeSlug)
  if (!place) return []
  const urls = [place.heroImageUrl, ...(place.imageUrls ?? [])].filter(
    (u): u is string => typeof u === 'string' && u.length > 0,
  )
  const unique = Array.from(new Set(urls))
  const source = place.sourceLinks?.[0] ?? ''
  const imgs = unique.map((src) => ({ src, artist: '', license: '', source }))
  // 3) En dernier recours, emprunt à un lieu proche.
  if (imgs.length === 0 && IMAGE_FALLBACK[placeSlug]) {
    return imagesForPlace(IMAGE_FALLBACK[placeSlug])
  }
  return imgs
}

// Décale un tableau de `n` positions — pour que chaque étape démarre sur une
// photo différente (plus de variété entre les étapes).
function rotate<T>(arr: T[], n: number): T[] {
  if (arr.length === 0) return arr
  const k = n % arr.length
  return [...arr.slice(k), ...arr.slice(0, k)]
}

function buildCatharTours(): Tour[] {
  return toursJson.tours.map((t) => {
    const pool = imagesForPlace(t.placeSlug)
    const stops: TourStop[] = t.stops.map((s, i) => ({
      id: s.id,
      title: s.title as Record<GuideLang, string>,
      subtitle: s.subtitle as Record<GuideLang, string>,
      text: s.text as Record<GuideLang, string>,
      images: rotate(pool, i * 2),
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
