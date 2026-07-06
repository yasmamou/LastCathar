// Guides audio narrés, bilingues (voix naturelles Piper TTS, open source) :
//   FR → fr_FR-tom-medium   EN → en_US-ryan-high
// Fichiers servis depuis public/audio-guides/<slug>.m4a (fr) et <slug>.en.m4a (en)
//
// SOURCE UNIQUE : src/data/audio-guides-content.json (fr),
//                 src/data/audio-guides-content.en.json (en),
//                 src/data/audio-guides-durations.json (durées réelles).
// Ne pas dupliquer le contenu ici — régénérer via `npm run audio:guides`.

import contentFr from './audio-guides-content.json'
import contentEn from './audio-guides-content.en.json'
import durations from './audio-guides-durations.json'

export type GuideLang = 'fr' | 'en'

export interface GuideTrack {
  file: string
  title: string
  duration: number
  transcript: string
}

export interface AudioGuide {
  slug: string
  langs: Record<GuideLang, GuideTrack>
}

const durationMap = durations as Record<string, number>

const enBySlug = new Map(contentEn.guides.map((g) => [g.slug, g]))

const GUIDES: AudioGuide[] = contentFr.guides.map((fr) => {
  const en = enBySlug.get(fr.slug)
  const langs: Record<GuideLang, GuideTrack> = {
    fr: {
      file: `/audio-guides/${fr.slug}.m4a`,
      title: fr.title,
      duration: durationMap[fr.slug] ?? 60,
      transcript: fr.text,
    },
    // Fallback to the FR track if an EN translation is ever missing
    en: en
      ? {
          file: `/audio-guides/${fr.slug}.en.m4a`,
          title: en.title,
          duration: durationMap[`${fr.slug}.en`] ?? 60,
          transcript: en.text,
        }
      : {
          file: `/audio-guides/${fr.slug}.m4a`,
          title: fr.title,
          duration: durationMap[fr.slug] ?? 60,
          transcript: fr.text,
        },
  }
  return { slug: fr.slug, langs }
})

const GUIDE_MAP = new Map(GUIDES.map((g) => [g.slug, g]))

export function getAudioGuide(slug: string): AudioGuide | undefined {
  return GUIDE_MAP.get(slug)
}

export const AUDIO_GUIDE_SLUGS: ReadonlySet<string> = new Set(GUIDE_MAP.keys())
