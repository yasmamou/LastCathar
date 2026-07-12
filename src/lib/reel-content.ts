// Contenu d'un reel (sous-titres + texte à narrer) pour un lieu, en FR ou EN.
// Utilisé par la composition Remotion (aperçu/rendu) ET par l'API de rendu
// (génération de la voix). Imports relatifs pour fonctionner dans les deux
// bundles (Next + Remotion).
import { getAudioGuide } from '../data/audio-guides'
import type { PlaceEntry } from '../types/places'

export interface ReelContent {
  captions: string[] // lignes de sous-titres (langue choisie)
  narration: string // texte lu par la voix
}

function shorten(s: string, max = 125): string {
  s = s.replace(/\s+/g, ' ').trim()
  return s.length > max ? s.slice(0, max - 1).trim() + '…' : s
}

function sentences(text: string): string[] {
  return (text || '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20)
}

export function buildReelContent(place: PlaceEntry, lang: 'fr' | 'en'): ReelContent {
  const guide = getAudioGuide(place.slug)

  // Si un audioguide existe (FR + EN), on s'en sert (contenu riche et bilingue).
  if (guide) {
    const caps = guide.langs[lang].transcript
      .split('\n\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 4)
      .map((s) => shorten(s))
    return { captions: caps, narration: `${place.title}. ${caps.join(' ')}` }
  }

  if (lang === 'en') {
    const caps = [
      shorten(`${place.title} — ${place.country}.`),
      'One of the hidden treasures explored on Last Cathar.',
    ]
    return { captions: caps, narration: caps.join(' ') }
  }

  // FR sans audioguide → données françaises du lieu
  const caps: string[] = []
  if (place.shortDescription) caps.push(shorten(place.shortDescription))
  for (const s of sentences(place.fullStory)) {
    caps.push(shorten(s))
    if (caps.length >= 4) break
  }
  const finalCaps = caps.length ? caps : [place.title]
  return { captions: finalCaps, narration: `${place.title}. ${finalCaps.join(' ')}` }
}
