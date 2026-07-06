// Guides audio narrés (voix française naturelle « Tom » via Piper TTS, open source).
// Fichiers servis depuis public/audio-guides/<slug>.m4a
//
// SOURCE UNIQUE : scripts/audio-guides-content.json (titres + textes) et
// scripts/audio-guides-durations.json (durées réelles, écrites par le
// générateur). Ne pas dupliquer le contenu ici — régénérer via `npm run audio:guides`.

import content from './audio-guides-content.json'
import durations from './audio-guides-durations.json'

export interface AudioGuide {
  slug: string
  file: string
  title: string
  duration: number
  transcript: string
}

const durationMap = durations as Record<string, number>

const GUIDES: AudioGuide[] = content.guides.map((g) => ({
  slug: g.slug,
  file: `/audio-guides/${g.slug}.m4a`,
  title: g.title,
  duration: durationMap[g.slug] ?? 60,
  transcript: g.text,
}))

const GUIDE_MAP = new Map(GUIDES.map((g) => [g.slug, g]))

export function getAudioGuide(slug: string): AudioGuide | undefined {
  return GUIDE_MAP.get(slug)
}

export const AUDIO_GUIDE_SLUGS: ReadonlySet<string> = new Set(GUIDE_MAP.keys())
